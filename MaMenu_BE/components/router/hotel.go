package router

import (
	"mamenu/components/middleware"

	"github.com/gin-gonic/gin"
)

func (r *ginRouter) registerHotelRoutes(api *gin.RouterGroup) {
	// WebSocket endpoints (hotel WS needs auth, order WS is public)
	wsGroup := api.Group("/ws")
	wsGroup.GET("/hotel/:hotel_id", middleware.AuthRequired(), middleware.RequireHotelAdmin(), r.hotelowner.WSHotel())
	wsGroup.GET("/order/:order_id", r.hotelowner.WSOrder())

	hotelGroup := api.Group("/hotel")
	hotelGroup.Use(middleware.AuthRequired(), middleware.RequireHotelAdmin())
	{
		hotelGroup.GET("/profile", r.hotelowner.GetProfile())
		hotelGroup.PUT("/switch", r.hotelowner.SwitchHotel())
		hotelGroup.GET("/my-hotels", r.hotelowner.GetMyHotels())

		// tables
		hotelGroup.POST("/tables", r.hotelowner.AddTable())
		hotelGroup.POST("/tables/bulk", r.hotelowner.AddTables())
		hotelGroup.GET("/tables", r.hotelowner.GetTables())
		hotelGroup.PUT("/tables/:id", r.hotelowner.UpdateTable())
		hotelGroup.DELETE("/tables/:id", r.hotelowner.DeleteTable())
		hotelGroup.PUT("/tables/:id/status", r.hotelowner.SetTableStatus())

		// categories
		hotelGroup.POST("/categories", r.hotelowner.CreateCategory())
		hotelGroup.GET("/categories", r.hotelowner.GetCategories())
		hotelGroup.PUT("/categories/:id", r.hotelowner.UpdateCategory())
		hotelGroup.DELETE("/categories/:id", r.hotelowner.DeleteCategory())

		// menu items
		hotelGroup.POST("/menu", r.hotelowner.CreateMenuItem())
		hotelGroup.GET("/menu", r.hotelowner.GetMenu())
		hotelGroup.PUT("/menu/:id", r.hotelowner.UpdateMenuItem())
		hotelGroup.DELETE("/menu/:id", r.hotelowner.DeleteMenuItem())
		hotelGroup.PUT("/menu/:id/availability", r.hotelowner.ToggleAvailability())

		// orders
		hotelGroup.GET("/orders", r.hotelowner.GetOrders())
		hotelGroup.PUT("/orders/:id/status", r.hotelowner.UpdateOrderStatus())
	}
}
