package auth

import (
	"net/http"
	"os"
	"time"

	"mamenu/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

func (a *auth) Login() gin.HandlerFunc {
	return func(ctx *gin.Context) {

		login := models.Login{}

		if err := ctx.ShouldBindJSON(&login); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}

		// fetch user by email
		user, err := a.database.GetUser(bson.M{"email": login.UserId})
		if err != nil {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
			return
		}

		// check password against stored hash
		if !a.checkPasswordHash(login.Password, user.Password) {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}

		// for hotel_admin: resolve default hotel and embed hotel_id in token
		hotelID := ""
		var defaultHotel interface{}

		if user.Role == models.RoleHotelAdmin && len(user.HotelIDs) > 0 {
			hotel, herr := a.database.GetHotelByID(user.HotelIDs[0])
			if herr == nil {
				defaultHotel = hotel
				hotelID = hotel.ID.Hex()
			}
		}

		token, err := a.generateToken(user.ID.Hex(), user.Email, string(user.Role), hotelID)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "token generation failed"})
			return
		}

		resp := gin.H{
			"message": "login successful",
			"token":   token,
		}
		if defaultHotel != nil {
			resp["default_hotel"] = defaultHotel
		}

		ctx.JSON(http.StatusOK, resp)
	}
}

func (a *auth) checkPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword(
		[]byte(hash),
		[]byte(password),
	)
	return err == nil
}

func (a *auth) generateToken(userID, email, role, hotelID string) (string, error) {
	secret := os.Getenv("JWT_SECRET")

	claims := jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"role":    role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}
	if hotelID != "" {
		claims["hotel_id"] = hotelID
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func (a *auth) hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost,
	)
	return string(bytes), err
}
