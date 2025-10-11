"use client";

import { useState } from "react";
import { CalendarDays, Clock, MapPin, User2, Car, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TripReservationForm() {
  const [tripType, setTripType] = useState<"oneway" | "return">("oneway");

  return (
    <div className="flex justify-center items-center min-h-screen bg-[url('/bg.jpg')] bg-cover bg-center">
      <Card className="w-full max-w-lg rounded-2xl shadow-xl bg-white/90 backdrop-blur-lg border-0">
        <CardHeader className="text-center">
          <div className="flex justify-center space-x-2 mb-3">
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500 opacity-70"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500 opacity-50"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500 opacity-40"></div>
          </div>
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Car className="text-yellow-500" />
            TRIP RESERVATION
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Start */}
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <Input placeholder="Start" className="pl-10 bg-white/80" />
          </div>

          {/* Destination */}
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <Input placeholder="Destination" className="pl-10 bg-white/80" />
          </div>

          {/* Trip Type Toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              type="button"
              onClick={() => setTripType("oneway")}
              className={`flex-1 rounded-none ${
                tripType === "oneway"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              → One Way
            </Button>
            <Button
              type="button"
              onClick={() => setTripType("return")}
              className={`flex-1 rounded-none ${
                tripType === "return"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <ArrowRightLeft className="mr-1 h-4 w-4" /> Return Trip
            </Button>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <CalendarDays className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <Input placeholder="Date (mm/dd/yyyy)" className="pl-10 bg-white/80" />
            </div>
            <div className="relative">
              <Clock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <Input placeholder="Time (--:-- --)" className="pl-10 bg-white/80" />
            </div>
          </div>

          {/* Passengers */}
          <div className="relative">
            <User2 className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <Input placeholder="Passengers" defaultValue="1" className="pl-10 bg-white/80" />
          </div>

          {/* Search Button */}
          <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 rounded-lg">
            Search
          </Button>

          {/* Disclaimer */}
          <p className="text-center text-xs text-gray-500 mt-2">
            By submitting my data, I agree to be contacted.
          </p>

          {/* Payment Icons */}
          <div className="flex justify-center items-center space-x-3 mt-2 opacity-80">
            <img src="/visa.svg" alt="Visa" className="h-5" />
            <img src="/mastercard.svg" alt="MasterCard" className="h-5" />
            <img src="/paypal.svg" alt="PayPal" className="h-5" />
            <img src="/twint.svg" alt="Twint" className="h-5" />
            <img src="/applepay.svg" alt="Apple Pay" className="h-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
