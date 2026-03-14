package hotelowner

import (
	"net/http"

	"mamenu/pkg/ws"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

// WSHotel — authenticated hotel admin connects to receive live order notifications.
// GET /ws/hotel/:hotel_id
func (h *hotelowner) WSHotel() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		hotelID := ctx.Param("hotel_id")
		if hotelID == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "hotel_id required"})
			return
		}

		conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
		if err != nil {
			return
		}

		client := ws.NewClient(conn)
		h.hub.RegisterHotelAdmin(hotelID, client)

		// Block until client disconnects (read loop just drains pings/close frames)
		defer func() {
			h.hub.UnregisterHotelAdmin(hotelID, client)
			client.Close()
		}()

		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				break
			}
		}
	}
}

// WSOrder — public endpoint, customer connects to watch their order status.
// GET /ws/order/:order_id
func (h *hotelowner) WSOrder() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		orderID := ctx.Param("order_id")
		if orderID == "" {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "order_id required"})
			return
		}

		conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
		if err != nil {
			return
		}

		client := ws.NewClient(conn)
		h.hub.RegisterOrderWatcher(orderID, client)

		defer func() {
			h.hub.UnregisterOrderWatcher(orderID, client)
			client.Close()
		}()

		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				break
			}
		}
	}
}
