import { axiosInstanceAuth, axiosInstance } from "../utils/axiosIntance";

export interface OrderItem {
  _id: string;
  variant: {
    _id: string;
    color: {
      _id: string;
      name: string;
      code: string;
      type?: string;
    };
    product: {
      _id: string;
      name: string;
      slug: string;
      images: Array<{
        url: string;
        public_id: string;
        isMain: boolean;
        displayOrder: number;
      }>;
    };
    price: number;
  };
  size: {
    _id: string;
    value: number;
    description?: string;
  };
  productName: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Order {
  _id: string;
  code: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: {
      url: string;
      public_id: string;
    };
  };
  orderItems: OrderItem[];
  shippingAddress: {
    name: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    detail: string;
  };
  note: string;
  subTotal: number;
  status: "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";
  inventoryDeducted: boolean;
  statusHistory: Array<{
    status: string;
    updatedAt: string;
    updatedBy?: string;
    note?: string;
  }>;
  payment: {
    method: "COD" | "VNPAY";
    paymentStatus: "pending" | "paid" | "failed";
    transactionId?: string;
    paidAt?: string;
  };
  paymentHistory: Array<{
    status: string;
    transactionId?: string;
    amount?: number;
    method?: string;
    updatedAt: string;
    responseData?: any;
  }>;
  coupon?: {
    _id: string;
    code: string;
    type: "percent" | "fixed";
    value: number;
    maxDiscount?: number;
  };
  couponDetail?: {
    code: string;
    type: "percent" | "fixed";
    value: number;
    maxDiscount?: number;
  };
  shippingFee: number;
  discount: number;
  totalAfterDiscountAndShipping: number;
  cancelRequestId?: string;
  hasCancelRequest: boolean;
  cancelReason: string;
  cancelledAt?: string;
  deliveredAt?: string;
  confirmedAt?: string;
  shippingAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  addressId: string;
  paymentMethod: "COD" | "VNPAY";
  note?: string;
  couponCode?: string;
}

export interface OrderQuery {
  page?: number;
  limit?: number;
  status?: "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";
  search?: string;
  sort?: string;
}

export interface CancelOrderData {
  reason: string;
  description?: string;
}

export interface OrdersResponse {
  success: boolean;
  message: string;
  data: {
    orders: Order[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    stats: {
      pending: number;
      confirmed: number;
      shipping: number;
      delivered: number;
      cancelled: number;
      total: number;
    };
  };
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: {
    order?: Order;
    paymentUrl?: string;
  };
}

export interface OrderDetailResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface VnpayCallbackParams {
  vnp_TmnCode: string;
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo?: string;
  vnp_CardType: string;
  vnp_PayDate: string;
  vnp_OrderInfo: string;
  vnp_TransactionNo: string;
  vnp_ResponseCode: string;
  vnp_TransactionStatus: string;
  vnp_TxnRef: string;
  vnp_SecureHashType: string;
  vnp_SecureHash: string;
}

export interface CancelRequest {
  _id: string;
  order: string;
  user: string;
  reason: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  processedBy?: string;
  processedAt?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CancelRequestsResponse {
  success: boolean;
  message: string;
  data: {
    cancelRequests: CancelRequest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

// User Order Service - các chức năng cho người dùng thường
export const userOrderService = {
  // Lấy danh sách đơn hàng của người dùng với phân trang và filter
  getOrders: (params: OrderQuery = {}): Promise<{ data: OrdersResponse }> =>
    axiosInstanceAuth.get("/api/v1/orders", { params }),

  // Tạo đơn hàng mới
  createOrder: (
    data: CreateOrderData
  ): Promise<{ data: CreateOrderResponse }> =>
    axiosInstanceAuth.post("/api/v1/orders", data),

  // Lấy chi tiết đơn hàng
  getOrderById: (orderId: string): Promise<{ data: OrderDetailResponse }> =>
    axiosInstanceAuth.get(`/api/v1/orders/${orderId}`),

  // Gửi yêu cầu hủy đơn hàng
  cancelOrder: (
    orderId: string,
    data: CancelOrderData
  ): Promise<{ data: any }> =>
    axiosInstanceAuth.post(`/api/v1/orders/${orderId}/cancel`, data),

  // Lấy danh sách yêu cầu hủy đơn hàng của user
  getUserCancelRequests: (params?: {
    page?: number;
    limit?: number;
    status?: "pending" | "approved" | "rejected";
  }): Promise<{ data: CancelRequestsResponse }> =>
    axiosInstanceAuth.get("/api/v1/orders/user-cancel-requests", { params }),

  // Thanh toán lại đơn hàng
  repayOrder: (orderId: string): Promise<{ data: CreateOrderResponse }> =>
    axiosInstanceAuth.post(`/api/v1/orders/${orderId}/repay`),
};

// Admin Order Service - các chức năng quản lý đơn hàng cho admin
export const adminOrderService = {
  // Lấy danh sách tất cả đơn hàng (admin)
  getAllOrders: (params: OrderQuery = {}): Promise<{ data: OrdersResponse }> =>
    axiosInstanceAuth.get("/api/v1/admin/orders", { params }),

  // Lấy chi tiết đơn hàng (admin)
  getOrderDetail: (orderId: string): Promise<{ data: OrderDetailResponse }> =>
    axiosInstanceAuth.get(`/api/v1/admin/orders/${orderId}`),

  // Cập nhật trạng thái đơn hàng
  updateOrderStatus: (
    orderId: string,
    data: {
      status: "confirmed" | "shipping" | "delivered";
      note?: string;
    }
  ): Promise<{ data: any }> =>
    axiosInstanceAuth.patch(`/api/v1/admin/orders/${orderId}/status`, data),

  // Lấy danh sách yêu cầu hủy đơn hàng
  getCancelRequests: (params?: {
    page?: number;
    limit?: number;
    status?: "pending" | "approved" | "rejected";
  }): Promise<{ data: CancelRequestsResponse }> =>
    axiosInstanceAuth.get("/api/v1/admin/orders/cancel-requests", { params }),

  // Xử lý yêu cầu hủy đơn hàng
  processCancelRequest: (
    requestId: string,
    data: {
      status: "approved" | "rejected";
      adminResponse?: string;
    }
  ): Promise<{ data: any }> =>
    axiosInstanceAuth.patch(
      `/api/v1/admin/orders/cancel-requests/${requestId}`,
      data
    ),
};

// Payment Service - xử lý thanh toán VNPAY
export const paymentService = {
  // Xử lý callback từ VNPAY
  vnpayCallback: (params: VnpayCallbackParams): Promise<{ data: any }> =>
    axiosInstance.get("/api/v1/orders/vnpay/callback", { params }),

  // Xử lý IPN từ VNPAY
  vnpayIpn: (data: VnpayCallbackParams): Promise<{ data: any }> =>
    axiosInstance.post("/api/v1/orders/vnpay/ipn", data),

  // Test callback từ VNPAY
  testVnpayCallback: (): Promise<{ data: any }> =>
    axiosInstance.get("/api/v1/orders/vnpay/test-callback"),
};

// Giữ lại cho tương thích ngược với code cũ
export const orderApi = {
  // User API
  getOrders: userOrderService.getOrders,
  createOrder: userOrderService.createOrder,
  getOrderById: userOrderService.getOrderById,
  cancelOrder: userOrderService.cancelOrder,
  getUserCancelRequests: userOrderService.getUserCancelRequests,
  repayOrder: userOrderService.repayOrder,

  // Admin API
  adminGetOrders: adminOrderService.getAllOrders,
  adminGetOrderById: adminOrderService.getOrderDetail,
  adminUpdateOrderStatus: adminOrderService.updateOrderStatus,
  adminGetCancelRequests: adminOrderService.getCancelRequests,
  adminProcessCancelRequest: adminOrderService.processCancelRequest,

  // Payment API
  vnpayCallback: paymentService.vnpayCallback,
  vnpayIpn: paymentService.vnpayIpn,
  testVnpayCallback: paymentService.testVnpayCallback,
};

export default userOrderService;
