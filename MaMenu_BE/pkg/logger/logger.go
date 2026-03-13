package logger

import (
	"fmt"
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var (
	ErrorLog = "error"
	InfoLog  = "info"
	DebugLog = "debug"
	AuditLog = "audit"
)

type Ilogger interface {
	WriteErrorLog(msg string)
	WriteDebugLog(msg string)
	WriteInfoLog(msg string)
	WriteAuditLog(msg ...zap.Field)
	CreateloggerWithConfig(enabled bool, appLogFile, auditLogFile string, applevel, reqlevel zapcore.Level) error
}

type logger struct {
	applogger *zap.Logger
	audit     *zap.Logger
}

func NewLogger() *logger {
	return &logger{}
}

func (l *logger) WriteErrorLog(msg string) {
	l.applogger.Error(msg)
}

func (l *logger) WriteDebugLog(msg string) {
	l.applogger.Debug(msg)
}

func (l *logger) WriteInfoLog(msg string) {
	l.applogger.Info(msg)
}

func (l *logger) WriteAuditLog(msg ...zap.Field) {
	l.audit.Info("api_request_log", msg...)
}

func (l *logger) CreateloggerWithConfig(enabled bool, appLogFile, auditLogFile string, applevel, reqlevel zapcore.Level) error {

	if !enabled {
		l.applogger = zap.NewNop()
		l.audit = zap.NewNop()
		return nil
	}

	appFile, err := os.OpenFile(appLogFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		fmt.Println("Error Setting up log file :", appLogFile)
		return err
	}

	auditFile, err := os.OpenFile(auditLogFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		fmt.Println("Error Setting up log file :", auditLogFile)
		return err
	}

	fileEncoderConfig := zap.NewProductionEncoderConfig()
	consoleEncoderConfig := zap.NewProductionEncoderConfig()

	consoleEncoderConfig.CallerKey = "Method"
	fileEncoderConfig.CallerKey = "Method"

	fileEncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	consoleEncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder

	l.applogger = zap.New(zapcore.NewTee(
		zapcore.NewCore(
			zapcore.NewConsoleEncoder(consoleEncoderConfig),
			zapcore.AddSync(os.Stdout),
			applevel,
		),
		zapcore.NewCore(
			zapcore.NewJSONEncoder(fileEncoderConfig),
			zapcore.AddSync(appFile),
			applevel,
		),
	))

	l.audit = zap.New(
		zapcore.NewCore(
			zapcore.NewJSONEncoder(fileEncoderConfig),
			zapcore.AddSync(auditFile),
			zapcore.DebugLevel,
		),
	)

	l.applogger.Info("Application logger initialized")
	l.audit.Info("Audit logger initialized")

	return nil
}

func GetLogLevel(level int) zapcore.Level {
	switch level {
	case 1:
		return zapcore.ErrorLevel
	case 2:
		return zapcore.InfoLevel
	case 3:
		return zapcore.DebugLevel
	default:
		return zapcore.ErrorLevel
	}
}
