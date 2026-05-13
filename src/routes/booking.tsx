import { createFileRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DateTimePicker } from "../components/booking/DateTimePicker";
import { GlassCard } from "../components/app/primitives";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const bookingSchema = z.object({
  pickupLocation: z.string().min(1, "Pick‑up location required"),
  dropLocation: z.string().min(1, "Drop‑off location required"),
  pickupDate: z.date({ required_error: "Pick-up date is required" }),
  dropDate: z.date({ required_error: "Drop-off date is required" }),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export const Route = createFileRoute('/booking')({
  component: BookingRouteShell,
});

function BookingRouteShell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname !== '/booking') {
    return <Outlet />;
  }

  return <BookingStepOne />;
}

function BookingStepOne() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  const onSubmit = (data: BookingFormData) => {
    // Store in session storage to pass to next step
    sessionStorage.setItem('booking_step_1', JSON.stringify(data));
    navigate({ to: '/booking/details' });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background/50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
          >
            Plan Your Journey
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg"
          >
            Enter your trip details to find the perfect vehicle.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className="p-8 border-primary/10 shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pickup Location */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Pickup Location
                  </label>
                  <input
                    {...register("pickupLocation")}
                    placeholder="City, Airport or Address"
                    className={`w-full bg-background/50 border ${errors.pickupLocation ? 'border-destructive' : 'border-muted'} rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all`}
                  />
                  {errors.pickupLocation && (
                    <p className="text-xs text-destructive font-medium">{errors.pickupLocation.message}</p>
                  )}
                </div>

                {/* Dropoff Location */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Drop-off Location
                  </label>
                  <input
                    {...register("dropLocation")}
                    placeholder="Same as pickup or other address"
                    className={`w-full bg-background/50 border ${errors.dropLocation ? 'border-destructive' : 'border-muted'} rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all`}
                  />
                  {errors.dropLocation && (
                    <p className="text-xs text-destructive font-medium">{errors.dropLocation.message}</p>
                  )}
                </div>

                {/* Pickup Date/Time */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Pickup</span>
                  </div>
                  <DateTimePicker control={control} name="pickupDate" />
                </div>

                {/* Return Date/Time */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Return</span>
                  </div>
                  <DateTimePicker control={control} name="dropDate" />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group"
                >
                  Find Vehicles
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </form>
          </GlassCard>
        </motion.div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-8 pt-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium">Free Cancellation</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium">Best Price Guaranteed</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium">24/7 Support</span>
          </div>
        </div>
      </div>
    </div>
  );
}
