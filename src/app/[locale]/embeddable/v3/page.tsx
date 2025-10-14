"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { MapPin, Clock, Users, ArrowRight, RefreshCw, CalendarIcon, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

type BookingType = "destination" | "hourly"
type TripType = "oneway" | "roundtrip"

type Errors = Partial<Record<"pickup" | "dropoff" | "date" | "time" | "passengers", string>>

export function BookingFormCompact() {
  const [mounted, setMounted] = useState(false)

  // Form state (self-contained; avoids external hooks/contexts)
  const [bookingType, setBookingType] = useState<BookingType>("destination")
  const [tripType, setTripType] = useState<TripType>("oneway")
  const [pickup, setPickup] = useState("")
  const [dropoff, setDropoff] = useState("")
  const [duration, setDuration] = useState<number>(2) // hours, used when hourly
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [passengers, setPassengers] = useState<number | "">("")
  const [errors, setErrors] = useState<Errors>({})
  const [isLoading, setIsLoading] = useState(false)

  const minDate = useMemo(() => new Date().toISOString().split("T")[0], [])

  useEffect(() => setMounted(true), [])

  const validate = (): boolean => {
    const next: Errors = {}
    if (!pickup.trim()) next.pickup = "Pickup location is required"
    if (bookingType === "destination" && !dropoff.trim()) next.dropoff = "Destination is required"
    if (!date) next.date = "Please select a date"
    if (!time) next.time = "Please select a time"
    if (!passengers || Number(passengers) < 1) next.passengers = "At least 1 passenger"

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    // Simulate redirect/loading
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      // In real integration, navigate or call an API here.
      // console.log("[v0] form submit", { bookingType, tripType, pickup, dropoff, duration, date, time, passengers });
      alert("Searching available rides…")
    }, 900)
  }

  return (
    <div
      className={`w-full mx-auto max-w-5xl bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-md font-sans transition-all duration-700 ease-out ${
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      } rounded-xl`}
      aria-label="Booking form container"
    >
      <Card className="rounded-xl bg-card/80 backdrop-blur-lg shadow-xl p-3 border border-border/40">
        <form onSubmit={onSubmit} className="space-y-3">
          {/* Booking type toggle - compact */}
          <div className="flex items-center justify-center">
            <div className="flex w-full max-w-md rounded-lg border border-border/50 bg-background/60 backdrop-blur-md p-0.5 text-xs font-medium shadow-sm">
              <button
                type="button"
                onClick={() => setBookingType("destination")}
                className={`flex-1 rounded-md px-3 py-2 transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  bookingType === "destination"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/70"
                }`}
                aria-pressed={bookingType === "destination"}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-[11px] leading-none">Destination</span>
              </button>
              <button
                type="button"
                onClick={() => setBookingType("hourly")}
                className={`flex-1 rounded-md px-3 py-2 transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  bookingType === "hourly"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/70"
                }`}
                aria-pressed={bookingType === "hourly"}
              >
                <Clock className="h-3.5 w-3.5" />
                <span className="text-[11px] leading-none">Hourly</span>
              </button>
            </div>
          </div>

          {/* Compact horizontal layout */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-2">
            {/* Pickup */}
            <InputGroup className="h-8">
              <InputGroupAddon align="inline-start" className="pl-2">
                <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Pickup location"
                placeholder="Pickup location"
                value={pickup}
                onChange={(e: { target: { value: React.SetStateAction<string> } }) => setPickup(e.target.value)}
                className="text-xs"
                aria-invalid={!!errors.pickup}
              />
            </InputGroup>
            {errors.pickup && (
              <p className="text-[11px] text-destructive flex items-center gap-1 lg:hidden">
                <AlertCircle className="h-3 w-3" />
                {errors.pickup}
              </p>
            )}

            {/* Dropoff or Duration */}
            {bookingType === "destination" ? (
              <>
                <InputGroup className="h-8">
                  <InputGroupAddon align="inline-start" className="pl-2">
                    <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  </InputGroupAddon>
                  <InputGroupInput
                    aria-label="Destination"
                    placeholder="Destination"
                    value={dropoff}
                    onChange={(e: { target: { value: React.SetStateAction<string> } }) => setDropoff(e.target.value)}
                    className="text-xs"
                    aria-invalid={!!errors.dropoff}
                  />
                </InputGroup>
                {errors.dropoff && (
                  <p className="text-[11px] text-destructive flex items-center gap-1 lg:hidden">
                    <AlertCircle className="h-3 w-3" />
                    {errors.dropoff}
                  </p>
                )}
              </>
            ) : (
              <InputGroup className="h-8">
                <InputGroupAddon align="inline-start" className="pl-2">
                  <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  aria-label="Duration (hours)"
                  type="number"
                  min={1}
                  placeholder="Duration (hours)"
                  value={duration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDuration(Math.max(1, Number(e.target.value || 1)))}
                  className="text-xs"
                />
                <InputGroupAddon align="inline-end" className="pr-2">
                  <InputGroupText className="text-muted-foreground">hrs</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            )}

            {/* Date */}
            <InputGroup className="h-8">
              <InputGroupAddon align="inline-start" className="pl-2">
                <CalendarIcon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Pickup date"
                type="date"
                min={minDate}
                value={date}
                onChange={(e: { target: { value: React.SetStateAction<string> } }) => setDate(e.target.value)}
                className="text-xs"
                aria-invalid={!!errors.date}
              />
            </InputGroup>
            {errors.date && (
              <p className="text-[11px] text-destructive flex items-center gap-1 lg:hidden">
                <AlertCircle className="h-3 w-3" />
                {errors.date}
              </p>
            )}

            {/* Time */}
            <InputGroup className="h-8">
              <InputGroupAddon align="inline-start" className="pl-2">
                <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Pickup time"
                type="time"
                value={time}
                onChange={(e: { target: { value: React.SetStateAction<string> } }) => setTime(e.target.value)}
                className="text-xs"
                aria-invalid={!!errors.time}
              />
            </InputGroup>
            {errors.time && (
              <p className="text-[11px] text-destructive flex items-center gap-1 lg:hidden">
                <AlertCircle className="h-3 w-3" />
                {errors.time}
              </p>
            )}

            {/* Passengers */}
            <InputGroup className="h-8">
              <InputGroupAddon align="inline-start" className="pl-2">
                <Users className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Passengers"
                type="number"
                min={1}
                max={15}
                placeholder="Passengers"
                value={passengers}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const v = e.target.value
                  if (v === "") return setPassengers("")
                  const n = Number(v)
                  if (!Number.isNaN(n) && n >= 0) setPassengers(n)
                }}
                className="text-xs"
                aria-invalid={!!errors.passengers}
              />
            </InputGroup>
            {errors.passengers && (
              <p className="text-[11px] text-destructive flex items-center gap-1 lg:hidden">
                <AlertCircle className="h-3 w-3" />
                {errors.passengers}
              </p>
            )}

            {/* Trip type (only for destination) */}
            {bookingType === "destination" && (
              <div className="flex rounded-md border border-border/50 bg-background/60 backdrop-blur-md p-0.5 text-[11px] font-medium shadow-sm">
                <button
                  type="button"
                  onClick={() => setTripType("oneway")}
                  className={`flex-1 rounded-sm px-2 py-1.5 transition-all duration-200 flex items-center justify-center gap-1 ${
                    tripType === "oneway"
                      ? "bg-background/80 shadow-sm text-primary"
                      : "text-muted-foreground hover:bg-background/70"
                  }`}
                  aria-pressed={tripType === "oneway"}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  One-way
                </button>
                <button
                  type="button"
                  onClick={() => setTripType("roundtrip")}
                  className={`flex-1 rounded-sm px-2 py-1.5 transition-all duration-200 flex items-center justify-center gap-1 ${
                    tripType === "roundtrip"
                      ? "bg-background/80 shadow-sm text-primary"
                      : "text-muted-foreground hover:bg-background/70"
                  }`}
                  aria-pressed={tripType === "roundtrip"}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Round-trip
                </button>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="rounded-md bg-primary text-primary-foreground h-8 px-4 text-xs font-semibold tracking-wide shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-1.5">
                  <Spinner className="h-3 w-3" />
                  Redirecting…
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  Search
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </Button>
          </div>

          {/* Inline error summary for larger screens */}
          {(errors.pickup || errors.dropoff || errors.date || errors.time || errors.passengers) && (
            <div className="hidden lg:flex text-[11px] text-destructive items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Please fix the highlighted fields.</span>
            </div>
          )}

          {/* Subtext */}
          <p className="text-[11px] text-muted-foreground text-center">
            By submitting my data, I agree to be contacted.
          </p>
        </form>
      </Card>
    </div>
  )
}

export default function EmbeddableBookingPageCompact() {
  return <BookingFormCompact />
}
