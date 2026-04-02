package admin

import (
	"net/http"

	"mamenu/models"
	"mamenu/pkg/logger"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

type createHotelOwnerRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Phone    string `json:"phone"`
	Password string `json:"password" binding:"required"`
}

type createHotelRequest struct {
	Name    string `json:"name" binding:"required"`
	OwnerID string `json:"owner_id" binding:"required"`
	Phone   string `json:"phone"`
	Email   string `json:"email"`
	Address string `json:"address"`
	City    string `json:"city"`
	State   string `json:"state"`
	Country string `json:"country"`
	Pincode string `json:"pincode"`
}

func (a *admin) CreateHotelOwner() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req createHotelOwnerRequest
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request: " + err.Error()})
			return
		}

		// check for duplicate email or phone
		dupFilter := bson.M{"email": req.Email}
		if req.Phone != "" {
			dupFilter = bson.M{"$or": []bson.M{{"email": req.Email}, {"phone": req.Phone}}}
		}
		if existing, _ := a.database.GetUser(dupFilter); existing != nil {
			ctx.JSON(http.StatusConflict, gin.H{"error": "a user with this email or phone already exists"})
			return
		}

		hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			a.logger.WriteLog(logger.ErrorLog, "password hash failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process password"})
			return
		}

		user := models.User{
			Name:     req.Name,
			Email:    req.Email,
			Phone:    req.Phone,
			Password: string(hashed),
			Role:     models.RoleHotelAdmin,
			IsActive: true,
		}

		created, err := a.database.CreateHotelOwner(user)
		if err != nil {
			a.logger.WriteLog(logger.ErrorLog, "create hotel owner failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create hotel owner"})
			return
		}

		ctx.JSON(http.StatusCreated, gin.H{
			"message": "hotel owner created",
			"data":    created,
		})
	}
}

func (a *admin) GetHotelOwners() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		owners, err := a.database.GetHotelOwners()
		if err != nil {
			a.logger.WriteLog(logger.ErrorLog, "get hotel owners failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch hotel owners"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{
			"data": owners,
		})
	}
}

func (a *admin) UpdateHotelOwner() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		id, err := primitive.ObjectIDFromHex(ctx.Param("id"))
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid owner id"})
			return
		}

		var req struct {
			Name     string `json:"name"`
			Email    string `json:"email"`
			Phone    string `json:"phone"`
			IsActive *bool  `json:"is_active"`
		}
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}

		data := bson.M{}
		if req.Name != "" {
			data["name"] = req.Name
		}
		if req.Email != "" {
			data["email"] = req.Email
		}
		if req.Phone != "" {
			data["phone"] = req.Phone
		}
		if req.IsActive != nil {
			data["is_active"] = *req.IsActive
		}

		if err := a.database.UpdateUser(id, data); err != nil {
			a.logger.WriteLog(logger.ErrorLog, "update hotel owner failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update hotel owner"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "hotel owner updated"})
	}
}

func (a *admin) DeleteHotelOwner() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		id, err := primitive.ObjectIDFromHex(ctx.Param("id"))
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid owner id"})
			return
		}

		if err := a.database.UpdateUser(id, bson.M{"is_active": false}); err != nil {
			a.logger.WriteLog(logger.ErrorLog, "delete hotel owner failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete hotel owner"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "hotel owner deleted"})
	}
}

func (a *admin) CreateHotel() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var req createHotelRequest
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request: " + err.Error()})
			return
		}

		ownerID, err := primitive.ObjectIDFromHex(req.OwnerID)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid owner_id"})
			return
		}

		hotel := models.Hotel{
			Name:    req.Name,
			OwnerID: ownerID,
			Phone:   req.Phone,
			Email:   req.Email,
			Address: req.Address,
			City:    req.City,
			State:   req.State,
			Country: req.Country,
			Pincode: req.Pincode,
		}

		created, err := a.database.CreateHotel(hotel)
		if err != nil {
			a.logger.WriteLog(logger.ErrorLog, "create hotel failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create hotel"})
			return
		}

		// push hotel ID into the owner's hotel_ids array
		if err := a.database.AddHotelToOwner(ownerID, created.ID); err != nil {
			a.logger.WriteLog(logger.ErrorLog, "add hotel to owner failed: "+err.Error())
			// hotel was created — don't fail the request, just log
		}

		ctx.JSON(http.StatusCreated, gin.H{
			"message": "hotel created",
			"data":    created,
		})
	}
}

func (a *admin) UpdateHotel() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		id, err := primitive.ObjectIDFromHex(ctx.Param("id"))
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid hotel id"})
			return
		}

		var req struct {
			Name    string `json:"name"`
			Phone   string `json:"phone"`
			Email   string `json:"email"`
			Address string `json:"address"`
			City    string `json:"city"`
			State   string `json:"state"`
			Country string `json:"country"`
			Pincode string `json:"pincode"`
			IsActive *bool `json:"is_active"`
		}
		if err := ctx.ShouldBindJSON(&req); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}

		data := bson.M{}
		if req.Name != "" {
			data["name"] = req.Name
		}
		if req.Phone != "" {
			data["phone"] = req.Phone
		}
		if req.Email != "" {
			data["email"] = req.Email
		}
		if req.Address != "" {
			data["address"] = req.Address
		}
		if req.City != "" {
			data["city"] = req.City
		}
		if req.State != "" {
			data["state"] = req.State
		}
		if req.Country != "" {
			data["country"] = req.Country
		}
		if req.Pincode != "" {
			data["pincode"] = req.Pincode
		}
		if req.IsActive != nil {
			data["is_active"] = *req.IsActive
		}

		if err := a.database.UpdateHotel(id, data); err != nil {
			a.logger.WriteLog(logger.ErrorLog, "update hotel failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update hotel"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "hotel updated"})
	}
}

func (a *admin) DeleteHotel() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		id, err := primitive.ObjectIDFromHex(ctx.Param("id"))
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid hotel id"})
			return
		}

		if err := a.database.UpdateHotel(id, bson.M{"is_active": false}); err != nil {
			a.logger.WriteLog(logger.ErrorLog, "delete hotel failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete hotel"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"message": "hotel deleted"})
	}
}

func (a *admin) GetHotels() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		hotels, err := a.database.GetHotels()
		if err != nil {
			a.logger.WriteLog(logger.ErrorLog, "get hotels failed: "+err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch hotels"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{
			"data": hotels,
		})
	}
}
