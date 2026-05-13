import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { GlassCard } from "../components/app/primitives";
import { CreditCard, CheckCircle2, AlertCircle, ExternalLink, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from 'react';

const checkoutSchema = z.object({
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions to proceed." }),
  }),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export const Route = createFileRoute('/booking/checkout')({
  component: BookingStepThree,
});

function BookingStepThree() {
  const navigate = useNavigate();
  const [fullData, setFullData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem('booking_full_data');
    if (!data) {
      navigate({ to: '/booking' });
      return;
    }
    setFullData(JSON.parse(data));
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async () => {
    setIsProcessing(true);
    // Simulate payment gateway initialization
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a real app, you'd redirect to Stripe/PayPal here
    // For this implementation, we simulate success and lead generation
    console.log("Lead generated for:", fullData.email);
    navigate({ to: '/booking/success' });
  };

  if (!fullData) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background/50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate({ to: '/booking/details' })}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-foreground">Final Review & Payment</h1>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Detailed Summary */}
          <GlassCard className="p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-muted pb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <h2 className="text-xl font-bold">Reservation Summary</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Trip Details</h3>
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Route</span>
                    <span className="font-medium">{fullData.pickupLocation} to {fullData.dropLocation}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Pick-up Date</span>
                    <span className="font-medium">{new Date(fullData.pickupDate).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Return Date</span>
                    <span className="font-medium">{new Date(fullData.dropDate).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Driver & Vehicle</h3>
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Name</span>
                    <span className="font-medium">{fullData.name}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Contact</span>
                    <span className="font-medium">{fullData.email} | {fullData.countryCode} {fullData.phone}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Vehicle Type</span>
                    <span className="font-medium capitalize">{fullData.vehicleId === '1' ? 'Sedan' : fullData.vehicleId === '2' ? 'Hatchback' : fullData.vehicleId === '3' ? 'SUV' : 'Luxury'}</span>
                  </div>
                </div>
              </div>
            </div>

            {fullData.notes && (
              <div className="bg-muted/30 p-4 rounded-lg border border-muted">
                <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">Additional Notes</span>
                <p className="text-sm italic">"{fullData.notes}"</p>
              </div>
            )}
          </GlassCard>

          {/* Payment & Terms */}
          <GlassCard className="p-8 border-primary/20 bg-primary/5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-background/50 rounded-xl border border-muted">
                <div className="mt-1">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    {...register("acceptTerms")}
                    className="h-5 w-5 rounded border-muted text-primary focus:ring-primary/20 transition-all cursor-pointer"
                  />
                </div>
                <label htmlFor="acceptTerms" className="text-sm leading-relaxed cursor-pointer select-none">
                  I have read and agree to the <a href="#" className="text-primary font-semibold hover:underline inline-flex items-center gap-1">Terms & Conditions <ExternalLink className="w-3 h-3" /></a> and the cancellation policy. I confirm that all information provided is accurate.
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="text-xs text-destructive flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {errors.acceptTerms.message}
                </p>
              )}

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 text-lg ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Redirecting to Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-6 h-6" />
                      Book Now & Pay
                    </>
                  )}
                </button>
                <div className="flex justify-center items-center gap-4 grayscale opacity-50">
                   <span className="text-[10px] font-bold uppercase tracking-widest">Secure Payment via</span>
                   <div className="h-6 w-12 bg-muted rounded animate-pulse" />
                   <div className="h-6 w-12 bg-muted rounded animate-pulse" />
                   <div className="h-6 w-12 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
