package hotelowner

import (
	"mamenu/pkg/logger"
	"mamenu/pkg/storage/database"

	"github.com/gin-gonic/gin"
)

type Ihotelowner interface {
	GetProfile() gin.HandlerFunc
	SwitchHotel() gin.HandlerFunc

	AddTable() gin.HandlerFunc
	GetTables() gin.HandlerFunc
	UpdateTable() gin.HandlerFunc
	DeleteTable() gin.HandlerFunc
	SetTableStatus() gin.HandlerFunc

	CreateCategory() gin.HandlerFunc
	GetCategories() gin.HandlerFunc
	UpdateCategory() gin.HandlerFunc
	DeleteCategory() gin.HandlerFunc

	CreateMenuItem() gin.HandlerFunc
	GetMenu() gin.HandlerFunc
	UpdateMenuItem() gin.HandlerFunc
	DeleteMenuItem() gin.HandlerFunc
	ToggleAvailability() gin.HandlerFunc

	// orders (public + hotel admin)
	PlaceOrder() gin.HandlerFunc
	GetOrders() gin.HandlerFunc
	UpdateOrderStatus() gin.HandlerFunc

	GetPublicMenu() gin.HandlerFunc
}

type hotelowner struct {
	database *database.DatabaseHandler
	logger   *logger.LoggerHandler
}

func NewHotelOwner(database *database.DatabaseHandler, logger *logger.LoggerHandler) *hotelowner {
	return &hotelowner{
		database: database,
		logger:   logger,
	}
}
