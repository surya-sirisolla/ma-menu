package auth

import (
	"mamenu/pkg/logger"
	"mamenu/pkg/storage/database"

	"github.com/gin-gonic/gin"
)

type Iauth interface {
	Login() gin.HandlerFunc
}

type auth struct {
	database *database.DatabaseHandler
	logger   *logger.LoggerHandler
}

func NewAuth(database *database.DatabaseHandler, logger *logger.LoggerHandler) *auth {
	return &auth{
		database: database,
		logger:   logger,
	}
}
