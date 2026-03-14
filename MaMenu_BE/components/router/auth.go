package router

import "github.com/gin-gonic/gin"

func (r *ginRouter) registerAuthRoutes(api *gin.RouterGroup) {
	api.POST("/auth/login", r.auth.Login())
}
