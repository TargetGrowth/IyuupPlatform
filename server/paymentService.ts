import { hyperSwitchService } from './hyperswitchService';

interface PaymentProvider {
  name: string;
  isAvailable: () => Promise<boolean>;
  createCustomer: (data: any) => Promise<any>;
  createPaymentIntent: (data: any) => Promise<any>;
  confirmPayment: (data: any) => Promise<any>;
  retrievePayment: (paymentId: string) => Promise<any>;
  capturePayment: (paymentId: string, amount?: number) => Promise<any>;
  refundPayment: (paymentId: string, data: any) => Promise<any>;
}

class HyperSwitchProvider implements PaymentProvider {
  name = 'HyperSwitch';

  async isAvailable(): Promise<boolean> {
    try {
      // Test with a minimal operation
      await hyperSwitchService.createCustomer({
        customer_id: `test_availability_${Date.now()}`,
        name: 'Availability Test'
      });
      return true;
    } catch (error) {
      console.log('HyperSwitch not available:', error.message);
      return false;
    }
  }

  async createCustomer(data: any) {
    return await hyperSwitchService.createCustomer(data);
  }

  async createPaymentIntent(data: any) {
    return await hyperSwitchService.createPaymentIntent(data);
  }

  async confirmPayment(data: any) {
    return await hyperSwitchService.confirmPayment(data);
  }

  async retrievePayment(paymentId: string) {
    return await hyperSwitchService.retrievePayment(paymentId);
  }

  async capturePayment(paymentId: string, amount?: number) {
    return await hyperSwitchService.capturePayment(paymentId, amount);
  }

  async refundPayment(paymentId: string, data: any) {
    return await hyperSwitchService.refundPayment(paymentId, data);
  }
}

class MockPaymentProvider implements PaymentProvider {
  name = 'Mock (Development)';

  async isAvailable(): Promise<boolean> {
    return process.env.NODE_ENV === 'development';
  }

  async createCustomer(data: any) {
    return {
      customer_id: data.customer_id,
      name: data.name,
      email: data.email,
      created: new Date().toISOString()
    };
  }

  async createPaymentIntent(data: any) {
    return {
      payment_id: `pi_mock_${Date.now()}`,
      client_secret: `pi_mock_${Date.now()}_secret`,
      status: 'requires_payment_method',
      amount: data.amount,
      currency: data.currency,
      created: new Date().toISOString()
    };
  }

  async confirmPayment(data: any) {
    return {
      payment_id: data.payment_id,
      status: 'succeeded',
      amount_received: 2000,
      currency: 'USD'
    };
  }

  async retrievePayment(paymentId: string) {
    return {
      payment_id: paymentId,
      status: 'succeeded',
      amount: 2000,
      currency: 'USD'
    };
  }

  async capturePayment(paymentId: string, amount?: number) {
    return {
      payment_id: paymentId,
      status: 'succeeded',
      amount_received: amount || 2000
    };
  }

  async refundPayment(paymentId: string, data: any) {
    return {
      refund_id: `re_mock_${Date.now()}`,
      payment_id: paymentId,
      amount: data.amount,
      status: 'succeeded'
    };
  }
}

class PaymentService {
  private providers: PaymentProvider[] = [
    new HyperSwitchProvider(),
    new MockPaymentProvider()
  ];
  
  private currentProvider: PaymentProvider | null = null;

  async getAvailableProvider(): Promise<PaymentProvider> {
    if (this.currentProvider) {
      return this.currentProvider;
    }

    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          this.currentProvider = provider;
          console.log(`Payment provider selected: ${provider.name}`);
          return provider;
        }
      } catch (error) {
        console.log(`Provider ${provider.name} not available:`, error.message);
      }
    }

    throw new Error('No payment provider available');
  }

  async createCustomer(data: any) {
    const provider = await this.getAvailableProvider();
    return await provider.createCustomer(data);
  }

  async createPaymentIntent(data: any) {
    const provider = await this.getAvailableProvider();
    return await provider.createPaymentIntent(data);
  }

  async confirmPayment(data: any) {
    const provider = await this.getAvailableProvider();
    return await provider.confirmPayment(data);
  }

  async retrievePayment(paymentId: string) {
    const provider = await this.getAvailableProvider();
    return await provider.retrievePayment(paymentId);
  }

  async capturePayment(paymentId: string, amount?: number) {
    const provider = await this.getAvailableProvider();
    return await provider.capturePayment(paymentId, amount);
  }

  async refundPayment(paymentId: string, data: any) {
    const provider = await this.getAvailableProvider();
    return await provider.refundPayment(paymentId, data);
  }

  getCurrentProviderName(): string {
    return this.currentProvider?.name || 'None';
  }

  async resetProvider() {
    this.currentProvider = null;
    return await this.getAvailableProvider();
  }
}

export const paymentService = new PaymentService();