package hotelowner

import "github.com/gin-gonic/gin"

type HotelOwnerHandler struct {
	h Ihotelowner
}

func NewHotelOwnerHandler(h Ihotelowner) *HotelOwnerHandler {
	return &HotelOwnerHandler{h: h}
}

func (hw *HotelOwnerHandler) GetProfile() gin.HandlerFunc       { return hw.h.GetProfile() }
func (hw *HotelOwnerHandler) SwitchHotel() gin.HandlerFunc      { return hw.h.SwitchHotel() }
func (hw *HotelOwnerHandler) AddTable() gin.HandlerFunc         { return hw.h.AddTable() }
func (hw *HotelOwnerHandler) GetTables() gin.HandlerFunc        { return hw.h.GetTables() }
func (hw *HotelOwnerHandler) UpdateTable() gin.HandlerFunc      { return hw.h.UpdateTable() }
func (hw *HotelOwnerHandler) DeleteTable() gin.HandlerFunc      { return hw.h.DeleteTable() }
func (hw *HotelOwnerHandler) SetTableStatus() gin.HandlerFunc   { return hw.h.SetTableStatus() }
func (hw *HotelOwnerHandler) CreateCategory() gin.HandlerFunc   { return hw.h.CreateCategory() }
func (hw *HotelOwnerHandler) GetCategories() gin.HandlerFunc    { return hw.h.GetCategories() }
func (hw *HotelOwnerHandler) UpdateCategory() gin.HandlerFunc   { return hw.h.UpdateCategory() }
func (hw *HotelOwnerHandler) DeleteCategory() gin.HandlerFunc   { return hw.h.DeleteCategory() }
func (hw *HotelOwnerHandler) CreateMenuItem() gin.HandlerFunc   { return hw.h.CreateMenuItem() }
func (hw *HotelOwnerHandler) GetMenu() gin.HandlerFunc          { return hw.h.GetMenu() }
func (hw *HotelOwnerHandler) UpdateMenuItem() gin.HandlerFunc   { return hw.h.UpdateMenuItem() }
func (hw *HotelOwnerHandler) DeleteMenuItem() gin.HandlerFunc   { return hw.h.DeleteMenuItem() }
func (hw *HotelOwnerHandler) ToggleAvailability() gin.HandlerFunc  { return hw.h.ToggleAvailability() }
func (hw *HotelOwnerHandler) PlaceOrder() gin.HandlerFunc          { return hw.h.PlaceOrder() }
func (hw *HotelOwnerHandler) GetOrders() gin.HandlerFunc           { return hw.h.GetOrders() }
func (hw *HotelOwnerHandler) UpdateOrderStatus() gin.HandlerFunc   { return hw.h.UpdateOrderStatus() }
func (hw *HotelOwnerHandler) GetPublicMenu() gin.HandlerFunc       { return hw.h.GetPublicMenu() }
