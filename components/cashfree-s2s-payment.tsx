"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Smartphone, Building2, FileText, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { post, get } from '@/lib/axios';

type PaymentMethod = 'upi' | 'card' | 'enach' | 'pnach';
type Step = 'method' | 'details' | 'processing' | 'redirect' | 'error';

interface BankOption {
  code: string;
  name: string;
}

const SUPPORTED_BANKS: BankOption[] = [
  { code: 'HDFC', name: 'HDFC Bank' },
  { code: 'ICIC', name: 'ICICI Bank' },
  { code: 'SBIN', name: 'State Bank of India' },
  { code: 'UTIB', name: 'Axis Bank' },
  { code: 'KKBK', name: 'Kotak Mahindra Bank' },
  { code: 'YESB', name: 'Yes Bank' },
  { code: 'PUNB', name: 'Punjab National Bank' },
  { code: 'BARB', name: 'Bank of Baroda' },
  { code: 'CNRB', name: 'Canara Bank' },
  { code: 'UBIN', name: 'Union Bank of India' },
];

interface CashfreeS2SPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: string; // MongoDB subscription ID from create response
  amount: number;
  productName: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function CashfreeS2SPayment({
  isOpen,
  onClose,
  subscriptionId,
  amount,
  productName,
  onSuccess,
  onError,
}: CashfreeS2SPaymentProps) {
  const [step, setStep] = useState<Step>('method');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingMsg, setProcessingMsg] = useState('');

  // Card details
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolderName: '',
    cardExpiryMm: '',
    cardExpiryYy: '',
    cardCvv: ''
  });

  // Bank details for eNACH/PNACH
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    accountType: 'SAVINGS',
    accountBankCode: '',
    accountIfsc: ''
  });

  const resetForm = () => {
    setStep('method');
    setPaymentMethod(null);
    setError(null);
    setCardDetails({
      cardNumber: '',
      cardHolderName: '',
      cardExpiryMm: '',
      cardExpiryYy: '',
      cardCvv: ''
    });
    setBankDetails({
      accountHolderName: '',
      accountNumber: '',
      confirmAccountNumber: '',
      accountType: 'SAVINGS',
      accountBankCode: '',
      accountIfsc: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const initiatePayment = async () => {
    if (!paymentMethod || !subscriptionId) {
      setError('Please select a payment method');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('processing');
    setProcessingMsg('Initiating payment...');

    try {
      let paymentDetails: any = {};

      switch (paymentMethod) {
        case 'upi':
          paymentDetails = { channel: 'link' };
          break;

        case 'card':
          if (!cardDetails.cardNumber || !cardDetails.cardHolderName || 
              !cardDetails.cardExpiryMm || !cardDetails.cardExpiryYy || !cardDetails.cardCvv) {
            throw new Error('Please fill all card details');
          }
          paymentDetails = {
            cardNumber: cardDetails.cardNumber.replace(/\s/g, ''),
            cardHolderName: cardDetails.cardHolderName,
            cardExpiryMm: cardDetails.cardExpiryMm,
            cardExpiryYy: cardDetails.cardExpiryYy,
            cardCvv: cardDetails.cardCvv
          };
          break;

        case 'enach':
          if (!bankDetails.accountHolderName || !bankDetails.accountNumber || 
              !bankDetails.accountBankCode) {
            throw new Error('Please fill all bank details');
          }
          if (bankDetails.accountNumber !== bankDetails.confirmAccountNumber) {
            throw new Error('Account numbers do not match');
          }
          paymentDetails = {
            authMode: 'net_banking',
            accountHolderName: bankDetails.accountHolderName,
            accountNumber: bankDetails.accountNumber,
            accountType: bankDetails.accountType,
            accountBankCode: bankDetails.accountBankCode
          };
          break;

        case 'pnach':
          if (!bankDetails.accountHolderName || !bankDetails.accountNumber || 
              !bankDetails.accountBankCode || !bankDetails.accountIfsc) {
            throw new Error('Please fill all bank details including IFSC');
          }
          if (bankDetails.accountNumber !== bankDetails.confirmAccountNumber) {
            throw new Error('Account numbers do not match');
          }
          paymentDetails = {
            authMode: 'debit_card',
            accountHolderName: bankDetails.accountHolderName,
            accountNumber: bankDetails.accountNumber,
            accountBankCode: bankDetails.accountBankCode,
            accountType: bankDetails.accountType,
            accountIfsc: bankDetails.accountIfsc
          };
          break;
      }

      setProcessingMsg('Connecting to payment gateway...');

      const response = await post<any>('/api/subscription/cashfree/s2s/pay', {
        subscriptionId,
        paymentMethod,
        paymentDetails
      });


      if (!response.success) {
        throw new Error(response.error || 'Payment initiation failed');
      }

      // Handle based on next action
      if (response.nextAction === 'REDIRECT' && response.redirectUrl) {
        setProcessingMsg('Redirecting to bank for authorization...');
        setStep('redirect');
        
        // Store subscription ID for status check on return
        sessionStorage.setItem('cashfree_subscription_id', subscriptionId);
        sessionStorage.setItem('cashfree_return_url', window.location.href);
        
        // Small delay to show message, then redirect
        setTimeout(() => {
          window.location.href = response.redirectUrl;
        }, 1500);
        
      } else if (response.nextAction === 'SHOW_LINK' && response.paymentLink) {
        setProcessingMsg('Opening UPI payment...');
        sessionStorage.setItem('cashfree_subscription_id', subscriptionId);
        
        setTimeout(() => {
          window.location.href = response.paymentLink;
        }, 1000);
        
      } else if (response.nextAction === 'POLL_STATUS') {
        // For PNACH - redirect to status page
        setProcessingMsg('Redirecting to check status...');
        sessionStorage.setItem('cashfree_subscription_id', subscriptionId);
        
        setTimeout(() => {
          window.location.href = `/dashboard?payment_status=pending&subscription_id=${subscriptionId}`;
        }, 1500);
        
      } else {
        // Unknown response - check status
        window.location.href = `/dashboard?subscription_id=${subscriptionId}`;
      }

    } catch (err: any) {
      console.error('❌ S2S payment error:', err);
      setError(err.message || 'Payment failed');
      setStep('error');
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-background rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-semibold">Complete Payment</h2>
              <p className="text-sm text-muted-foreground">{productName}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Error display */}
            {error && step === 'error' && (
              <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Payment Error</span>
                </div>
                <p className="mt-1 text-sm text-destructive/80">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => { setStep('method'); setError(null); }}
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Amount display */}
            {step !== 'processing' && step !== 'redirect' && (
              <div className="mb-4 p-3 bg-primary/5 rounded-lg text-center">
                <span className="text-sm text-muted-foreground">Amount to pay</span>
                <p className="text-2xl font-bold text-primary">₹{amount.toLocaleString('en-IN')}</p>
              </div>
            )}

            {/* Step: Method Selection */}
            {step === 'method' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">Select payment method:</p>
                
                <button
                  onClick={() => { setPaymentMethod('upi'); setStep('details'); }}
                  className="w-full flex items-center p-4 rounded-lg border-2 hover:border-primary transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-4">
                    <Smartphone className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium">UPI</h4>
                    <p className="text-sm text-muted-foreground">Pay via UPI app (GPay, PhonePe, etc.)</p>
                  </div>
                </button>

                <button
                  onClick={() => { setPaymentMethod('card'); setStep('details'); }}
                  className="w-full flex items-center p-4 rounded-lg border-2 hover:border-primary transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-4">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium">Credit/Debit Card</h4>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard, Rupay</p>
                  </div>
                </button>

                <button
                  onClick={() => { setPaymentMethod('enach'); setStep('details'); }}
                  className="w-full flex items-center p-4 rounded-lg border-2 hover:border-primary transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-4">
                    <Building2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium">eNACH (Net Banking)</h4>
                    <p className="text-sm text-muted-foreground">Auto-debit mandate via net banking</p>
                  </div>
                </button>

                <button
                  onClick={() => { setPaymentMethod('pnach'); setStep('details'); }}
                  className="w-full flex items-center p-4 rounded-lg border-2 hover:border-primary transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mr-4">
                    <FileText className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium">Physical NACH</h4>
                    <p className="text-sm text-muted-foreground">Bank verification (3-5 business days)</p>
                  </div>
                </button>
              </div>
            )}

            {/* Step: UPI Details */}
            {step === 'details' && paymentMethod === 'upi' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="icon" onClick={() => setStep('method')}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="font-medium">UPI Payment</h3>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    You will be redirected to complete payment via your UPI app (Google Pay, PhonePe, Paytm, etc.)
                  </p>
                </div>

                <Button onClick={initiatePayment} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Proceed to Pay ₹{amount.toLocaleString('en-IN')}
                </Button>
              </div>
            )}

            {/* Step: Card Details */}
            {step === 'details' && paymentMethod === 'card' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="icon" onClick={() => setStep('method')}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="font-medium">Card Details</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Card Number</Label>
                    <Input
                      type="text"
                      maxLength={19}
                      placeholder="1234 5678 9012 3456"
                      value={cardDetails.cardNumber}
                      onChange={(e) => setCardDetails({ 
                        ...cardDetails, 
                        cardNumber: formatCardNumber(e.target.value) 
                      })}
                    />
                  </div>

                  <div>
                    <Label>Cardholder Name</Label>
                    <Input
                      type="text"
                      placeholder="JOHN DOE"
                      value={cardDetails.cardHolderName}
                      onChange={(e) => setCardDetails({ 
                        ...cardDetails, 
                        cardHolderName: e.target.value.toUpperCase() 
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Month</Label>
                      <Input
                        type="text"
                        maxLength={2}
                        placeholder="MM"
                        value={cardDetails.cardExpiryMm}
                        onChange={(e) => setCardDetails({ 
                          ...cardDetails, 
                          cardExpiryMm: e.target.value.replace(/\D/g, '') 
                        })}
                      />
                    </div>
                    <div>
                      <Label>Year</Label>
                      <Input
                        type="text"
                        maxLength={2}
                        placeholder="YY"
                        value={cardDetails.cardExpiryYy}
                        onChange={(e) => setCardDetails({ 
                          ...cardDetails, 
                          cardExpiryYy: e.target.value.replace(/\D/g, '') 
                        })}
                      />
                    </div>
                    <div>
                      <Label>CVV</Label>
                      <Input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={cardDetails.cardCvv}
                        onChange={(e) => setCardDetails({ 
                          ...cardDetails, 
                          cardCvv: e.target.value.replace(/\D/g, '') 
                        })}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={initiatePayment} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Pay ₹{amount.toLocaleString('en-IN')}
                </Button>
              </div>
            )}

            {/* Step: Bank Details (eNACH/PNACH) */}
            {step === 'details' && (paymentMethod === 'enach' || paymentMethod === 'pnach') && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="icon" onClick={() => setStep('method')}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="font-medium">
                    {paymentMethod === 'enach' ? 'eNACH Details' : 'Physical NACH Details'}
                  </h3>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  {paymentMethod === 'enach' 
                    ? 'Set up auto-debit mandate via net banking. You will be redirected to your bank.'
                    : 'Set up mandate via bank verification. This takes 3-5 business days.'}
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Account Holder Name</Label>
                    <Input
                      type="text"
                      placeholder="As per bank records"
                      value={bankDetails.accountHolderName}
                      onChange={(e) => setBankDetails({ 
                        ...bankDetails, 
                        accountHolderName: e.target.value 
                      })}
                    />
                  </div>

                  <div>
                    <Label>Account Number</Label>
                    <Input
                      type="text"
                      placeholder="Enter account number"
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails({ 
                        ...bankDetails, 
                        accountNumber: e.target.value.replace(/\D/g, '') 
                      })}
                    />
                  </div>

                  <div>
                    <Label>Confirm Account Number</Label>
                    <Input
                      type="text"
                      placeholder="Re-enter account number"
                      value={bankDetails.confirmAccountNumber}
                      onChange={(e) => setBankDetails({ 
                        ...bankDetails, 
                        confirmAccountNumber: e.target.value.replace(/\D/g, '') 
                      })}
                    />
                    {bankDetails.accountNumber && bankDetails.confirmAccountNumber && 
                     bankDetails.accountNumber !== bankDetails.confirmAccountNumber && (
                      <p className="text-destructive text-xs mt-1">Account numbers don't match</p>
                    )}
                  </div>

                  <div>
                    <Label>Select Bank</Label>
                    <Select 
                      value={bankDetails.accountBankCode} 
                      onValueChange={(value) => setBankDetails({ ...bankDetails, accountBankCode: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_BANKS.map(bank => (
                          <SelectItem key={bank.code} value={bank.code}>
                            {bank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Account Type</Label>
                    <Select 
                      value={bankDetails.accountType} 
                      onValueChange={(value) => setBankDetails({ ...bankDetails, accountType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAVINGS">Savings Account</SelectItem>
                        <SelectItem value="CURRENT">Current Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentMethod === 'pnach' && (
                    <div>
                      <Label>IFSC Code</Label>
                      <Input
                        type="text"
                        maxLength={11}
                        placeholder="e.g., HDFC0001234"
                        value={bankDetails.accountIfsc}
                        onChange={(e) => setBankDetails({ 
                          ...bankDetails, 
                          accountIfsc: e.target.value.toUpperCase() 
                        })}
                      />
                    </div>
                  )}
                </div>

                <Button onClick={initiatePayment} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {paymentMethod === 'enach' ? 'Proceed to Bank Authorization' : 'Submit for Verification'}
                </Button>
              </div>
            )}

            {/* Step: Processing */}
            {step === 'processing' && (
              <div className="py-8 text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="mt-4 text-muted-foreground">{processingMsg}</p>
                <p className="text-xs text-muted-foreground mt-2">Please wait, do not refresh...</p>
              </div>
            )}

            {/* Step: Redirect */}
            {step === 'redirect' && (
              <div className="py-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                <p className="mt-4 font-medium">Redirecting to your bank...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Complete the authorization on your bank's page
                </p>
                <Loader2 className="h-5 w-5 animate-spin mx-auto mt-4 text-muted-foreground" />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CashfreeS2SPayment;
