package hotelowner

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"mamenu/models"
	"mamenu/pkg/logger"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ---- helpers ----

func hotelIDFromCtx(ctx *gin.Context) (primitive.ObjectID, bool) {
	raw, exists := ctx.Get("hotel_id")
	if !exists {
		return primitive.NilObjectID, false
	}
	str, ok := raw.(string)
	if !ok {
		return primitive.NilObjectID, false
	}
	id, err := primitive.ObjectIDFromHex(str)
	if err != nil {
		return primitive.NilObjectID, false
	}
	return id, true
}

func userIDFromCtx(ctx *gin.Context) string {
	v, _ := ctx.Get("user_id")
	s, _ := v.(string)
	return s
}

func (h *hotelowner) generateToken(userID, email, role, hotelID string) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	claims := jwt.MapClaims{
		"user_id":  userID,
		"email":    email,
		"role":     role,
		"hotel_id": hotelID,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ---- Profile & Switch Hotel ----

func (h *hotelowner) GetProfile() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		userID := userIDFromCtx(ctx)
		ownerOID, err := primitive.ObjectIDFromHex(userID)
		if err != nil {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		user, err := h.database.GetUser(bson.M{"_id": ownerOID})
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch profile"})
			return
		}

		hotelID, ok := hotelIDFromCtx(ctx)
		var hotel interface{}
		if ok {
			h2, herr := h.database.GetHotelByID(hotelID)
			if herr == nil {
				hotel = h2
			}
		}

		ctx.JSON(http.StatusOK, gin.H{
			"user":          user,
			"active_hotel":  hotel,
		})
	}
}

func (h *hotelowner) SwitchHotel() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req struct {
			HotelID string `json:"hotel_id" binding:"required"`
		}
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "hotel_id required"})
			return
		}

		userID := userIDFromCtx(ctx)
		ownerOID, err := primitive.ObjectIDFromHex(userID)
		if err != nil {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		requestedID, err := primitive.ObjectIDFromHex(req.HotelID)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid hotel_id"})
			return
		}

		user, err := h.database.GetUser(bson.M{"_id": ownerOID})
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch user"})
			return
		}

		// validate hotel belongs to this owner
		belongs := false
		for _, id := range user.HotelIDs {
			if id == requestedID {
				belongs = true
				break
			}
		}
		if !belongs {
			ctx.JSON(http.StatusForbidden, gin.H{"error": "hotel does not belong to you"})
			return
		}

		hotel, err := h.database.GetHotelByID(requestedID)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch hotel"})
			return
		}

		emailVal, _ := ctx.Get("email")
		email, _ := emailVal.(string)

		token, err := h.generateToken(userID, email, string(models.RoleHotelAdmin), req.HotelID)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "token generation failed"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{
			"message":      "hotel switched",
			"token":        token,
			"active_hotel": hotel,
		})
	}
}

// ---- Tables ----

func (h *hotelowner) AddTable() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		hotelID, ok := hotelIDFromCtx(ctx)
		if !ok {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "no active hotel in token"})
			return
		}

		var req struct {
			Number   int    `json:"number" binding:"required"`
			Label    string `json:"label"`
			Capacity int    `json:"capacity"`
		}
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request: " + err.Error()})
			return
		}

		qrCode := fmt.Sprintf("/menu/%s?table=%d", hotelID.Hex(), req.Number)

		table := models.Table{
			HotelID:  hotelID,
			Number:   req.Number,
			Label:    req.Label,
			Capacity: req.Capacity,
			QRCode:   qrCode,
		}

		created, err := h.database.CreateTable(table)
		if err != nil {
			h.logger.WriteLog(logger.ErrorLog, "create table failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create table"})
			return
		}

		ctx.JSON(http.StatusCreated, gin.H{"message": "table created", "data": created})
	}
}

func (h *hotelowner) GetTables() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		hotelID, ok := hotelIDFromCtx(ctx)
		if !ok {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "no active hotel in token"})
			return
		}

		tables, err := h.database.GetTablesByHotel(hotelID)
		if err != nil {
			h.logger.WriteLog(logger.ErrorLog, "get tables failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch tables"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"data": tables})
	}
}

func (h *hotelowner) UpdateTable() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		id, err := primitive.ObjectIDFromHex(ctx.Param("id"))
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid table id"})
			return
		}

		var req struct {
			Label    string `json:"label"`
			Capacity int    `json:"capacity"`
		}
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}

		data := bson.M{}
		if req.Label != "" {
			data["label"] = req.Label
		}
		if req.Capacity > 0 {
			data["capacity"] = req.Capacity
		}

		if err := h.database.UpdateTable(id, data); err != nil {
			h.logger.WriteLog(logger.ErrorLog, "update table failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update table"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "table updated"})
	}
}

func (h *hotelowner) DeleteTable() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		id, err := primitive.ObjectIDFromHex(ctx.Param("id"))
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid table id"})
			return
		}

		if err := h.database.UpdateTable(id, bson.M{"is_active": false}); err != nil {
			h.logger.WriteLog(logger.ErrorLog, "delete table failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete table"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "table deleted"})
	}
}

func (h *hotelowner) SetTableStatus() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		id, err := primitive.ObjectIDFromHex(ctx.Param("id"))
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid table id"})
			return
		}

		var req struct {
			IsOccupied bool `json:"is_occupied"`
		}
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}

		if err := h.database.UpdateTable(id, bson.M{"is_occupied": req.IsOccupied}); err != nil {
			h.logger.WriteLog(logger.ErrorLog, "set table status failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update table status"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "table status updated"})
	}
}

// ---- Categories ----

func (h *hotelowner) CreateCategory() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		hotelID, ok := hotelIDFromCtx(ctx)
		if !ok {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "no active hotel in token"})
			return
		}

		var req struct {
			Name      string  `json:"name" binding:"required"`
			Type      string  `json:"type"`
			ParentID  string  `json:"parent_id"`
			SortOrder int     `json:"sort_order"`
		}
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request: " + err.Error()})
			return
		}

		cat := models.Category{
			HotelID:   hotelID,
			Name:      req.Name,
			Type:      req.Type,
			SortOrder: req.SortOrder,
		}

		if req.ParentID != "" {
			pid, err := primitive.ObjectIDFromHex(req.ParentID)
			if err != nil {
				ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid parent_id"})
				return
			}
			cat.ParentID = &pid
		}

		created, err := h.database.CreateCategory(cat)
		if err != nil {
			h.logger.WriteLog(logger.ErrorLog, "create category failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create category"})
			return
		}

		ctx.JSON(http.StatusCreated, gin.H{"message": "category created", "data": created})
	}
}

func (h *hotelowner) GetCategories() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		hotelID, ok := hotelIDFromCtx(ctx)
		if !ok {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "no active hotel in token"})
			return
		}

		cats, err := h.database.GetCategoriesByHotel(hotelID)
		if err != nil {
			h.logger.WriteLog(logger.ErrorLog, "get categories failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch categories"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"data": buildCategoryTree(cats)})
	}
}

func (h *hotelowner) UpdateCategory() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		id, err := primitive.ObjectIDFromHex(ctx.Param("id"))
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid category id"})
			return
		}

		var req struct {
			Name      string `json:"name"`
			Type      string `json:"type"`
			SortOrder int    `json:"sort_order"`
		}
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}

		data := bson.M{}
		if req.Name != "" {
			data["name"] = req.Name
		}
		if req.Type != "" {
			data["type"] = req.Type
		}
		if req.SortOrder > 0 {
			data["sort_order"] = req.SortOrder
		}

		if err := h.database.UpdateCategory(id, data); err != nil {
			h.logger.WriteLog(logger.ErrorLog, "update category failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update category"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "category updated"})
	}
}

func (h *hotelowner) DeleteCategory() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		id, err := primitive.ObjectIDFromHex(ctx.Param("id"))
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid category id"})
			return
		}

		if err := h.database.UpdateCategory(id, bson.M{"is_active": false}); err != nil {
			h.logger.WriteLog(logger.ErrorLog, "delete category failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete category"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "category deleted"})
	}
}

// ---- Menu Items ----

func (h *hotelowner) CreateMenuItem() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		hotelID, ok := hotelIDFromCtx(ctx)
		if !ok {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "no active hotel in token"})
			return
		}

		var req struct {
			CategoryID  string   `json:"category_id" binding:"required"`
			Name        string   `json:"name" binding:"required"`
			Description string   `json:"description"`
			Price       float64  `json:"price" binding:"required"`
			ImageURL    string   `json:"image_url"`
			IsVeg       bool     `json:"is_veg"`
			Tags        []string `json:"tags"`
			SortOrder   int      `json:"sort_order"`
		}
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request: " + err.Error()})
			return
		}

		catID, err := primitive.ObjectIDFromHex(req.CategoryID)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid category_id"})
			return
		}

		item := models.MenuItem{
			HotelID:     hotelID,
			CategoryID:  catID,
			Name:        req.Name,
			Description: req.Description,
			Price:       req.Price,
			ImageURL:    req.ImageURL,
			IsVeg:       req.IsVeg,
			Tags:        req.Tags,
			SortOrder:   req.SortOrder,
		}

		created, err := h.database.CreateMenuItem(item)
		if err != nil {
			h.logger.WriteLog(logger.ErrorLog, "create menu item failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create menu item"})
			return
		}

		ctx.JSON(http.StatusCreated, gin.H{"message": "menu item created", "data": created})
	}
}

func (h *hotelowner) GetMenu() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		hotelID, ok := hotelIDFromCtx(ctx)
		if !ok {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "no active hotel in token"})
			return
		}

		filter := bson.M{"hotel_id": hotelID, "is_active": true}
		if catID := ctx.Query("category_id"); catID != "" {
			oid, err := primitive.ObjectIDFromHex(catID)
			if err == nil {
				filter["category_id"] = oid
			}
		}

		items, err := h.database.GetMenuItemsByHotel(filter)
		if err != nil {
			h.logger.WriteLog(logger.ErrorLog, "get menu failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch menu"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"data": items})
	}
}

func (h *hotelowner) UpdateMenuItem() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		id, err := primitive.ObjectIDFromHex(ctx.Param("id"))
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid menu item id"})
			return
		}

		var req struct {
			Name        string   `json:"name"`
			Description string   `json:"description"`
			Price       float64  `json:"price"`
			ImageURL    string   `json:"image_url"`
			IsVeg       *bool    `json:"is_veg"`
			Tags        []string `json:"tags"`
			SortOrder   int      `json:"sort_order"`
		}
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}

		data := bson.M{}
		if req.Name != "" {
			data["name"] = req.Name
		}
		if req.Description != "" {
			data["description"] = req.Description
		}
		if req.Price > 0 {
			data["price"] = req.Price
		}
		if req.ImageURL != "" {
			data["image_url"] = req.ImageURL
		}
		if req.IsVeg != nil {
			data["is_veg"] = *req.IsVeg
		}
		if req.Tags != nil {
			data["tags"] = req.Tags
		}
		if req.SortOrder > 0 {
			data["sort_order"] = req.SortOrder
		}

		if err := h.database.UpdateMenuItem(id, data); err != nil {
			h.logger.WriteLog(logger.ErrorLog, "update menu item failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update menu item"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "menu item updated"})
	}
}

func (h *hotelowner) DeleteMenuItem() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		id, err := primitive.ObjectIDFromHex(ctx.Param("id"))
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid menu item id"})
			return
		}

		if err := h.database.UpdateMenuItem(id, bson.M{"is_active": false}); err != nil {
			h.logger.WriteLog(logger.ErrorLog, "delete menu item failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete menu item"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "menu item deleted"})
	}
}

func (h *hotelowner) ToggleAvailability() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		id, err := primitive.ObjectIDFromHex(ctx.Param("id"))
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid menu item id"})
			return
		}

		var req struct {
			IsAvailable bool `json:"is_available"`
		}
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}

		if err := h.database.UpdateMenuItem(id, bson.M{"is_available": req.IsAvailable}); err != nil {
			h.logger.WriteLog(logger.ErrorLog, "toggle availability failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update availability"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "availability updated"})
	}
}

// ---- Category tree builder ----

func buildCategoryTree(cats []*models.Category) []*models.CategoryTree {
	roots := make([]*models.CategoryTree, 0)
	if len(cats) == 0 {
		return roots
	}

	index := make(map[primitive.ObjectID]*models.CategoryTree, len(cats))
	for _, c := range cats {
		index[c.ID] = &models.CategoryTree{Category: *c}
	}

	for _, node := range index {
		if node.ParentID == nil {
			roots = append(roots, node)
		} else if parent, ok := index[*node.ParentID]; ok {
			parent.Children = append(parent.Children, node)
		} else {
			roots = append(roots, node)
		}
	}

	return roots
}
