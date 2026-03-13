package router

import (
	"mamenu/components/middleware"
	adminsvc "mamenu/components/services/admin"
	authsvc "mamenu/components/services/auth"
	hotelownersvc "mamenu/components/services/hotelowner"

	"github.com/gin-gonic/gin"
)

type Igin interface {
	RegisterEndpoints()
}

type ginRouter struct {
	engine     *gin.Engine
	auth       *authsvc.AuthHandler
	admin      *adminsvc.AdminHandler
	hotelowner *hotelownersvc.HotelOwnerHandler
}

func NewGinRouter(
	engine *gin.Engine,
	auth *authsvc.AuthHandler,
	admin *adminsvc.AdminHandler,
	hotelowner *hotelownersvc.HotelOwnerHandler,
) *ginRouter {
	return &ginRouter{
		engine:     engine,
		auth:       auth,
		admin:      admin,
		hotelowner: hotelowner,
	}
}

func (r *ginRouter) RegisterEndpoints() {
	api := r.engine.Group("/api/v1")

	// ---- Public routes ----
	api.POST("/auth/login", r.auth.Login())
	api.GET("/public/menu/:hotel_id", r.hotelowner.GetPublicMenu())
	api.POST("/public/orders/:hotel_id", r.hotelowner.PlaceOrder())

	// ---- Super admin routes ----
	adminGroup := api.Group("/admin")
	// adminGroup.Use(middleware.AuthRequired(), middleware.RequireSuperAdmin())
	{
		adminGroup.POST("/hotel-owners", r.admin.CreateHotelOwner())
		adminGroup.GET("/hotel-owners", r.admin.GetHotelOwners())
		adminGroup.POST("/hotels", r.admin.CreateHotel())
		adminGroup.GET("/hotels", r.admin.GetHotels())
	}

	// ---- Hotel owner routes ----
	hotelGroup := api.Group("/hotel")
	hotelGroup.Use(middleware.AuthRequired(), middleware.RequireHotelAdmin())
	{
		hotelGroup.GET("/profile", r.hotelowner.GetProfile())
		hotelGroup.PUT("/switch", r.hotelowner.SwitchHotel())

		// tables
		hotelGroup.POST("/tables", r.hotelowner.AddTable())
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
