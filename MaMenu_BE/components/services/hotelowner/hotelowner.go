package hotelowner

import (
	"mamenu/pkg/logger"
	"mamenu/pkg/storage/database"
	"mamenu/pkg/ws"

	"github.com/gin-gonic/gin"
)

type Ihotelowner interface {
	GetProfile() gin.HandlerFunc
	SwitchHotel() gin.HandlerFunc
	GetMyHotels() gin.HandlerFunc

	// WebSocket endpoints
	WSHotel() gin.HandlerFunc
	WSOrder() gin.HandlerFunc

	AddTable() gin.HandlerFunc
	AddTables() gin.HandlerFunc
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
	hub      *ws.Hub
}

func NewHotelOwner(database *database.DatabaseHandler, logger *logger.LoggerHandler, hub *ws.Hub) *hotelowner {
	return &hotelowner{
		database: database,
		logger:   logger,
		hub:      hub,
	}
}
