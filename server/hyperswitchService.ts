import axios from 'axios';
import jwt from 'jsonwebtoken';

interface PaymentIntentRequest {
  amount: number;
  currency: string;
  customer_id?: string;
  description?: string;
  metadata?: any;
  capture_method?: 'automatic' | 'manual';
  confirm?: boolean;
  payment_method_data?: any;
  return_url?: string;
  setup_future_usage?: 'on_session' | 'off_session';
  splits?: SplitPayment[];
}

interface SplitPayment {
  type: 'fixed' | 'percentage';
  amount?: number;
  percentage?: number;
  account: string;
  reference?: string;
}

interface PaymentIntentResponse {
  payment_id: string;
  client_secret: string;
  status: string;
  amount: number;
  currency: string;
  created: string;
  next_action?: any;
}

interface ConfirmPaymentRequest {
  payment_id: string;
  payment_method: {
    type: string;
    card?: {
      number: string;
      exp_month: string;
      exp_year: string;
      cvc: string;
      cardholder_name?: string;
    };
    billing?: {
      address?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
      };
    };
  };
  return_url?: string;
}

class HyperSwitchService {
  private apiKey: string;
  private merchantId: string;
  private profileId: string;
  private baseUrl: string = 'https://sandbox.hyperswitch.io'; // Use production URL for live

  constructor() {
    if (!process.env.HYPERSWITCH_API_KEY) {
      throw new Error('HYPERSWITCH_API_KEY is required');
    }
    if (!process.env.HYPERSWITCH_MERCHANT_ID) {
      throw new Error('HYPERSWITCH_MERCHANT_ID is required');
    }
    // Profile ID is often the same as merchant_id or set to "default"
    this.apiKey = process.env.HYPERSWITCH_API_KEY;
    this.merchantId = process.env.HYPERSWITCH_MERCHANT_ID;
    this.profileId = process.env.HYPERSWITCH_PROFILE_ID || this.merchantId;
  }

  private generateJWT(): string {
    const payload = {
      iss: this.merchantId,
      sub: this.merchantId,
      aud: 'hyperswitch',
      exp: Math.floor(Date.now() / 1000) + (5 * 60), // 5 minutes expiry
      iat: Math.floor(Date.now() / 1000),
      jti: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    return jwt.sign(payload, this.apiKey, { algorithm: 'HS256' });
  }

  private getHeaders() {
    const jwtToken = this.generateJWT();
    return {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async createPaymentIntent(data: PaymentIntentRequest): Promise<PaymentIntentResponse> {
    try {
      const payload = {
        amount: data.amount,
        currency: data.currency,
        customer_id: data.customer_id,
        description: data.description,
        metadata: data.metadata,
        capture_method: data.capture_method || 'automatic',
        confirm: data.confirm || false,
        payment_method_data: data.payment_method_data,
        return_url: data.return_url,
        setup_future_usage: data.setup_future_usage,
        splits: data.splits,
        profile_id: this.profileId,
      };

      const response = await axios.post(
        `${this.baseUrl}/payments`,
        payload,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error creating payment intent:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to create payment intent');
    }
  }

  async confirmPayment(data: ConfirmPaymentRequest): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payments/${data.payment_id}/confirm`,
        {
          payment_method: data.payment_method,
          return_url: data.return_url,
        },
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error confirming payment:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to confirm payment');
    }
  }

  async retrievePayment(paymentId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/payments/${paymentId}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error retrieving payment:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to retrieve payment');
    }
  }

  async createCustomer(customerData: {
    customer_id: string;
    name?: string;
    email?: string;
    phone?: string;
    description?: string;
  }): Promise<any> {
    try {
      const payload = {
        ...customerData,
        profile_id: this.profileId,
      };
      
      const response = await axios.post(
        `${this.baseUrl}/customers`,
        payload,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error creating customer:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to create customer');
    }
  }

  async capturePayment(paymentId: string, amountToCapture?: number): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payments/${paymentId}/capture`,
        amountToCapture ? { amount_to_capture: amountToCapture } : {},
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error capturing payment:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to capture payment');
    }
  }

  async refundPayment(paymentId: string, refundData: {
    amount?: number;
    reason?: string;
    metadata?: any;
  }): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/refunds`,
        {
          payment_id: paymentId,
          ...refundData,
        },
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error creating refund:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to create refund');
    }
  }
}

export const hyperSwitchService = new HyperSwitchService();
export default HyperSwitchService;