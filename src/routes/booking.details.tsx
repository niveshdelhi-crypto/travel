import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { VehicleSelect } from "../components/booking/VehicleSelect";
import { GlassCard } from "../components/app/primitives";
import { User, Mail, Phone, FileText, ArrowLeft, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from 'react';

const detailsSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number required"),
  countryCode: z.string().min(1, "Country code required"),
  notes: z.string().optional(),
  vehicleId: z.string().min(1, "Please select a vehicle type"),
});

type DetailsFormData = z.infer<typeof detailsSchema>;

export const Route = createFileRoute('/booking/details')({
  component: BookingStepTwo,
});

function BookingStepTwo() {
  const navigate = useNavigate();
  const [prevData, setPrevData] = useState<any>(null);

  useEffect(() => {
    const data = sessionStorage.getItem('booking_step_1');
    if (!data) {
      navigate({ to: '/booking' });
      return;
    }
    setPrevData(JSON.parse(data));
  }, []);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DetailsFormData>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      countryCode: "+1",
    }
  });

  const onSubmit = (data: DetailsFormData) => {
    const combined = { ...prevData, ...data };
    sessionStorage.setItem('booking_full_data', JSON.stringify(combined));
    navigate({ to: '/booking/checkout' });
  };

  if (!prevData) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background/50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate({ to: '/booking' })}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Complete Your Booking</h1>
            <p className="text-muted-foreground">Add your information and select a vehicle.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Form Details */}
            <div className="lg:col-span-2 space-y-6">
              <GlassCard className="p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-muted pb-4">
                  <User className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Personal Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <div className="relative">
                      <input
                        {...register("name")}
                        className={`w-full bg-background/50 border ${errors.name ? 'border-destructive' : 'border-muted'} rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none`}
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <div className="relative">
                      <input
                        {...register("email")}
                        className={`w-full bg-background/50 border ${errors.email ? 'border-destructive' : 'border-muted'} rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none`}
                        placeholder="john@example.com"
                      />
                    </div>
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <div className="flex gap-2">
                      <input
                        {...register("countryCode")}
                        className="w-20 bg-background/50 border border-muted rounded-lg px-3 py-2 text-center focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="+1"
                      />
                      <input
                        {...register("phone")}
                        className={`flex-1 bg-background/50 border ${errors.phone ? 'border-destructive' : 'border-muted'} rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none`}
                        placeholder="123 456 7890"
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Special Requests / Notes
                  </label>
                  <textarea
                    {...register("notes")}
                    rows={3}
                    className="w-full bg-background/50 border border-muted rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                    placeholder="Any specific requests for the provider?"
                  />
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <VehicleSelect control={control} />
              </GlassCard>
            </div>

            {/* Right Column: Order Summary (Sticky) */}
            <div className="space-y-6">
              <GlassCard className="p-6 sticky top-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  Trip Summary
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-muted/50">
                    <span className="text-muted-foreground">Pickup</span>
                    <span className="font-medium">{prevData.pickupLocation}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-muted/50">
                    <span className="text-muted-foreground">Drop-off</span>
                    <span className="font-medium">{prevData.dropLocation}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-muted/50">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{new Date(prevData.pickupDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl shadow-lg transition-all"
                  >
                    Proceed to Payment
                  </button>
                  <p className="text-[10px] text-center text-muted-foreground mt-3">
                    By proceeding, you agree to our booking policies.
                  </p>
                </div>
              </GlassCard>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
