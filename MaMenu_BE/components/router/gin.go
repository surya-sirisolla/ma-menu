package router

import (
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

	r.registerAuthRoutes(api)
	r.registerPublicRoutes(api)
	r.registerAdminRoutes(api)
	r.registerHotelRoutes(api)
}
