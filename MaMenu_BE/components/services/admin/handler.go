package admin

import "github.com/gin-gonic/gin"

type AdminHandler struct {
	admin Iadmin
}

func NewAdminHandler(admin Iadmin) *AdminHandler {
	return &AdminHandler{admin: admin}
}

func (h *AdminHandler) CreateHotelOwner() gin.HandlerFunc {
	return h.admin.CreateHotelOwner()
}

func (h *AdminHandler) GetHotelOwners() gin.HandlerFunc {
	return h.admin.GetHotelOwners()
}

func (h *AdminHandler) CreateHotel() gin.HandlerFunc {
	return h.admin.CreateHotel()
}

func (h *AdminHandler) GetHotels() gin.HandlerFunc {
	return h.admin.GetHotels()
}
