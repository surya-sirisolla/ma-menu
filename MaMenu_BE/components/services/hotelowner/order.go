package hotelowner

import (
	"net/http"

	"mamenu/models"
	"mamenu/pkg/logger"
	"mamenu/pkg/ws"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PlaceOrder — public endpoint, no auth required
func (h *hotelowner) PlaceOrder() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		hotelIDStr := ctx.Param("hotel_id")
		hotelID, err := primitive.ObjectIDFromHex(hotelIDStr)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid hotel_id"})
			return
		}

		var req struct {
			TableNumber  int    `json:"table_number"`
			TableLabel   string `json:"table_label"`
			CustomerName string `json:"customer_name"`
			Notes        string `json:"notes"`
			Items        []struct {
				ItemID   string `json:"item_id" binding:"required"`
				Quantity int    `json:"quantity" binding:"required"`
			} `json:"items" binding:"required,min=1"`
		}
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request: " + err.Error()})
			return
		}

		// resolve item details from DB
		var orderItems []models.OrderItem
		var total float64
		for _, ri := range req.Items {
			itemID, err := primitive.ObjectIDFromHex(ri.ItemID)
			if err != nil {
				ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid item_id: " + ri.ItemID})
				return
			}
			dbItems, err := h.database.GetMenuItemsByHotel(bson.M{"_id": itemID, "hotel_id": hotelID, "is_available": true})
			if err != nil || len(dbItems) == 0 {
				ctx.JSON(http.StatusBadRequest, gin.H{"error": "item not found or unavailable: " + ri.ItemID})
				return
			}
			item := dbItems[0]
			qty := ri.Quantity
			if qty <= 0 {
				qty = 1
			}
			orderItems = append(orderItems, models.OrderItem{
				ItemID:   itemID,
				Name:     item.Name,
				Price:    item.Price,
				Quantity: qty,
				IsVeg:    item.IsVeg,
			})
			total += item.Price * float64(qty)
		}

		order := models.Order{
			HotelID:      hotelID,
			TableNumber:  req.TableNumber,
			TableLabel:   req.TableLabel,
			CustomerName: req.CustomerName,
			Notes:        req.Notes,
			Items:        orderItems,
			TotalAmount:  total,
		}

		created, err := h.database.CreateOrder(order)
		if err != nil {
			h.logger.WriteLog(logger.ErrorLog, "place order failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to place order"})
			return
		}

		// Mark the table as occupied (best-effort, don't fail the order on error)
		if req.TableNumber > 0 {
			_ = h.database.UpdateTableByFilter(
				bson.M{"hotel_id": hotelID, "number": req.TableNumber, "is_active": true},
				bson.M{"is_occupied": true},
			)
		}

		// Broadcast new order to hotel admin WS room
		if h.hub != nil {
			h.hub.BroadcastToHotel(hotelIDStr, ws.Message{Type: "new_order", Payload: created})
		}

		ctx.JSON(http.StatusCreated, gin.H{
			"message": "order placed",
			"data":    created,
		})
	}
}

// GetOrders — hotel admin, auth required
func (h *hotelowner) GetOrders() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		hotelID, ok := hotelIDFromCtx(ctx)
		if !ok {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "no active hotel in token"})
			return
		}

		filter := bson.M{"hotel_id": hotelID}
		if status := ctx.Query("status"); status != "" {
			filter["status"] = models.OrderStatus(status)
		}

		orders, err := h.database.GetOrdersByHotel(filter)
		if err != nil {
			h.logger.WriteLog(logger.ErrorLog, "get orders failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch orders"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"data": orders})
	}
}

// UpdateOrderStatus — hotel admin, auth required
func (h *hotelowner) UpdateOrderStatus() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		id, err := primitive.ObjectIDFromHex(ctx.Param("id"))
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid order id"})
			return
		}

		var req struct {
			Status models.OrderStatus `json:"status" binding:"required"`
		}
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "status required"})
			return
		}

		validStatuses := map[models.OrderStatus]bool{
			models.OrderConfirmed:  true,
			models.OrderPreparing:  true,
			models.OrderReady:      true,
			models.OrderCompleted:  true,
			models.OrderCancelled:  true,
		}
		if !validStatuses[req.Status] {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid status"})
			return
		}

		if err := h.database.UpdateOrderStatus(id, bson.M{"status": req.Status}); err != nil {
			h.logger.WriteLog(logger.ErrorLog, "update order status failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update order status"})
			return
		}

		// Free the table when the order is cancelled or completed (best-effort)
		if req.Status == models.OrderCancelled || req.Status == models.OrderCompleted {
			if order, err := h.database.GetOrderByID(id); err == nil && order.TableNumber > 0 {
				_ = h.database.UpdateTableByFilter(
					bson.M{"hotel_id": order.HotelID, "number": order.TableNumber, "is_active": true},
					bson.M{"is_occupied": false},
				)
			}
		}

		// Broadcast status update to customer WS watchers
		if h.hub != nil {
			h.hub.BroadcastToOrder(ctx.Param("id"), ws.Message{
				Type:    "order_status",
				Payload: map[string]string{"status": string(req.Status), "order_id": ctx.Param("id")},
			})
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "order status updated", "status": req.Status})
	}
}
