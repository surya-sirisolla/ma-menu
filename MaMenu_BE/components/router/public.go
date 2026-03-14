package router

import "github.com/gin-gonic/gin"

func (r *ginRouter) registerPublicRoutes(api *gin.RouterGroup) {
	api.GET("/public/menu/:hotel_id", r.hotelowner.GetPublicMenu())
	api.POST("/public/orders/:hotel_id", r.hotelowner.PlaceOrder())
}
