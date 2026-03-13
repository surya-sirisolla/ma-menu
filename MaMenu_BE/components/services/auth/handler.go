package auth

import (
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	auth Iauth
}

func NewAuthHandler(auth Iauth) *AuthHandler {
	return &AuthHandler{
		auth: auth,
	}
}

func (h *AuthHandler) Login() gin.HandlerFunc {
	return h.auth.Login()
}
