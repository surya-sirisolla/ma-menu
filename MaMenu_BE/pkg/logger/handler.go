package logger

import (
	"fmt"
	"os"
	"strconv"

	"go.uber.org/zap"
)

type LoggerHandler struct {
	logger Ilogger
}

func NewLoggerHandler(logger Ilogger) *LoggerHandler {
	return &LoggerHandler{
		logger: logger,
	}
}

func (lh *LoggerHandler) SetupLogger() error {
	fmt.Println("Setting up logger...")

	enabled := os.Getenv("LOG_ENABLED") == "true"
	appLogFile := os.Getenv("APP_LOG_FILE")
	auditLogFile := os.Getenv("AUDIT_LOG_FILE")

	levelStr := os.Getenv("APP_LOG_LEVEL")
	level, err := strconv.Atoi(levelStr)
	if err != nil {
		level = 2
	}

	err = lh.logger.CreateloggerWithConfig(
		enabled,
		appLogFile,
		auditLogFile,
		GetLogLevel(level),
		GetLogLevel(level),
	)

	if err != nil {
		fmt.Println("Error Setting up logger :", err.Error())
		return err
	}

	return nil
}

func (lh *LoggerHandler) WriteLog(t, msg string) {
	switch t {
	case InfoLog:
		lh.logger.WriteInfoLog(msg)
	case DebugLog:
		lh.logger.WriteDebugLog(msg)
	case ErrorLog:
		lh.logger.WriteErrorLog(msg)
	default:
		lh.logger.WriteErrorLog(msg)
	}
}

func (lh *LoggerHandler) WriteAuditLog(msg ...zap.Field) {
	lh.logger.WriteAuditLog(msg...)
}