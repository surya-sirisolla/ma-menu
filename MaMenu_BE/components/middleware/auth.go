package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthRequired() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// Accept Bearer header or ?token= query param (for WebSocket connections)
		var tokenStr string
		header := ctx.GetHeader("Authorization")
		if header != "" && strings.HasPrefix(header, "Bearer ") {
			tokenStr = strings.TrimPrefix(header, "Bearer ")
		} else if q := ctx.Query("token"); q != "" {
			tokenStr = q
		} else {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid authorization header"})
			return
		}
		secret := os.Getenv("JWT_SECRET")

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			return
		}

		ctx.Set("user_id", claims["user_id"])
		ctx.Set("email", claims["email"])
		ctx.Set("role", claims["role"])

		if hotelID, ok := claims["hotel_id"]; ok && hotelID != "" {
			ctx.Set("hotel_id", hotelID)
		}

		ctx.Next()
	}
}

func RequireSuperAdmin() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		role, exists := ctx.Get("role")
		if !exists || role != "super_admin" {
			ctx.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "access denied: super admin only"})
			return
		}
		ctx.Next()
	}
}

func RequireHotelAdmin() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		role, exists := ctx.Get("role")
		if !exists || role != "hotel_admin" {
			ctx.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "access denied: hotel admin only"})
			return
		}
		ctx.Next()
	}
}
