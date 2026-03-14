package router

import "github.com/gin-gonic/gin"

func (r *ginRouter) registerAdminRoutes(api *gin.RouterGroup) {
	adminGroup := api.Group("/admin")
	// adminGroup.Use(middleware.AuthRequired(), middleware.RequireSuperAdmin())
	{
		adminGroup.POST("/hotel-owners", r.admin.CreateHotelOwner())
		adminGroup.GET("/hotel-owners", r.admin.GetHotelOwners())
		adminGroup.PUT("/hotel-owners/:id", r.admin.UpdateHotelOwner())
		adminGroup.DELETE("/hotel-owners/:id", r.admin.DeleteHotelOwner())
		adminGroup.POST("/hotels", r.admin.CreateHotel())
		adminGroup.GET("/hotels", r.admin.GetHotels())
		adminGroup.PUT("/hotels/:id", r.admin.UpdateHotel())
		adminGroup.DELETE("/hotels/:id", r.admin.DeleteHotel())
	}
}
