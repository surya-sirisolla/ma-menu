package admin

import (
	"mamenu/pkg/logger"
	"mamenu/pkg/storage/database"

	"github.com/gin-gonic/gin"
)

type Iadmin interface {
	CreateHotelOwner() gin.HandlerFunc
	GetHotelOwners() gin.HandlerFunc
	CreateHotel() gin.HandlerFunc
	GetHotels() gin.HandlerFunc
}

type admin struct {
	database *database.DatabaseHandler
	logger   *logger.LoggerHandler
}

func NewAdmin(database *database.DatabaseHandler, logger *logger.LoggerHandler) *admin {
	return &admin{
		database: database,
		logger:   logger,
	}
}
