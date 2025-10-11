"use client";

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, MapPin, Clock, Calendar, Users, CheckCircle2, Shield, CreditCard, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useBookingForm } from '@/contexts/BookingFormContext';
import Image from 'next/image';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { useTheme } from '@/contexts/ThemeContext';

export default function Step2VehicleSelection() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const { settings } = useTheme();
  
  const {
    formData,
    setFormData,
    vehicles,
    setVehicles,
    distanceData,
    setCurrentStep,
  } = useBookingForm();

  // Initialize Google Maps
  useEffect(() => {
    const initGoogleMaps = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn("Google Maps API key not configured");
        return;
      }

      try {
        setOptions({
          key: apiKey,
          v: "weekly",
        });

        const [maps, routes] = await Promise.all([
          importLibrary("maps"),
          importLibrary("routes"),
        ]);

        // Initialize map
        if (mapRef.current && !googleMapRef.current) {
          const initialCenter =
            settings && settings.mapInitialLat && settings.mapInitialLng
              ? { lat: settings.mapInitialLat, lng: settings.mapInitialLng }
              : { lat: 46.2044, lng: 6.1432 }; // Default to Geneva

          googleMapRef.current = new maps.Map(mapRef.current, {
            center: initialCenter,
            zoom: 8,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });
          setMapLoaded(true);

          // If we have pickup and dropoff, show the route
          if (formData.pickup && formData.dropoff) {
            const directionsService = new routes.DirectionsService();
            
            directionsService.route(
              {
                origin: formData.pickup,
                destination: formData.dropoff,
                travelMode: google.maps.TravelMode.DRIVING,
              },
              (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
                if (status === 'OK' && result && googleMapRef.current) {
                  if (!directionsRendererRef.current) {
                    directionsRendererRef.current = new routes.DirectionsRenderer({
                      map: googleMapRef.current,
                      suppressMarkers: false,
                      polylineOptions: {
                        strokeColor: 'var(--primary-color)',
                        strokeWeight: 4,
                      },
                    });
                  }
                  if (directionsRendererRef.current) {
                    directionsRendererRef.current.setDirections(result);
                  }
                }
              }
            );
          }
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    if (settings) {
      initGoogleMaps();
    }
  }, [settings, formData.pickup, formData.dropoff]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch('/api/vehicles?isActive=true');
        const data = await response.json();
        if (data.success) {
          setVehicles(data.data);
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    };

    fetchVehicles();
  }, [setVehicles]);

  const calculatePrice = (vehicle: typeof vehicles[0]) => {
    if (!distanceData) {
      return vehicle.price;
    }
    const distancePrice = vehicle.pricePerKm * distanceData.distance.km;
    const totalPrice = vehicle.price + distancePrice;
    return Math.max(totalPrice, vehicle.minimumFare);
  };

  const handleVehicleSelect = (vehicleId: string) => {
    setFormData(prev => ({ ...prev, selectedVehicle: vehicleId }));
    setCurrentStep(3);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content - Vehicle Selection */}
      <div className="lg:col-span-2 space-y-4">
        {/* Map Section */}
        <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden bg-gray-200">
          <div ref={mapRef} className="w-full h-full" />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Select Your Vehicle</h2>
          <p className="text-gray-600 text-sm">Choose the perfect vehicle for your journey</p>
        </div>

        {vehicles.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
            <p className="text-gray-500 text-sm">Loading available vehicles...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map((vehicle) => {
              const calculatedPrice = calculatePrice(vehicle);
              const isSelected = formData.selectedVehicle === vehicle._id;

              return (
                <Card
                  key={vehicle._id}
                  className={`relative overflow-hidden transition-all ${
                    isSelected ? 'border-primary border-2 shadow-lg' : 'border-gray-200 hover:border-primary/70'
                  }`}
                >
                  <div className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Vehicle Image */}
                      <div className="flex-shrink-0">
                        {vehicle.image ? (
                          <Image
                            src={vehicle.image}
                            alt={vehicle.name}
                            width={120}
                            height={85}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-[120px] h-[85px] bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No image</span>
                          </div>
                        )}
                      </div>

                      {/* Vehicle Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1.5">
                          <div>
                            <h3 className="font-bold text-base">{vehicle.name}</h3>
                            {vehicle.category && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary mt-0.5">
                                {vehicle.category === 'economy' && '⭐ Best price'}
                                {vehicle.category === 'standard' && '✨ Standard'}
                                {vehicle.category === 'premium' && '👑 Premium'}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            {distanceData && calculatedPrice !== vehicle.price && (
                              <p className="text-xs text-gray-500 line-through">€{vehicle.price.toFixed(2)}</p>
                            )}
                            <p className="text-xl font-bold text-gray-900">
                              €{calculatedPrice.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {distanceData ? 'Total One Way' : 'Starting from'}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">{vehicle.description}</p>

                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 mb-2">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span>Max. {vehicle.persons} passengers</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>
                            </svg>
                            <span>Max. {vehicle.baggages} suitcases</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="h-4 w-4 text-green-600" />
                            <span>Licensed Chauffeur</span>
                          </div>
                          {vehicle.minimumFare && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span>Free Cancellation</span>
                            </div>
                          )}
                        </div>

                        {distanceData && (
                          <p className="text-xs text-gray-500 mb-2">
                            Base fare: €{vehicle.price} + €{vehicle.pricePerKm}/km × {distanceData.distance.km.toFixed(1)} km
                            {calculatedPrice === vehicle.minimumFare && ` (Minimum fare applied: €${vehicle.minimumFare})`}
                          </p>
                        )}

                        <Button
                          onClick={() => handleVehicleSelect(vehicle._id!)}
                          className={`w-full py-2 ${
                            isSelected
                              ? 'bg-primary hover:bg-primary/90'
                              : 'bg-secondary hover:bg-secondary/90'
                          } text-white`}
                        >
                          {isSelected ? '✓ Selected' : 'Select'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Button 
          onClick={() => setCurrentStep(1)}
          variant="outline"
          className="w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Trip Details
        </Button>
      </div>

      {/* Sidebar - Trip Summary */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4 p-5 space-y-4">
          <h3 className="font-bold text-lg border-b pb-2">Your Trip</h3>

          {/* Trip Details */}
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{formData.pickup || 'Pickup location'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{formData.dropoff || 'Dropoff location'}</p>
              </div>
            </div>

            {distanceData && (
              <>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700">{distanceData.duration.text}</span>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className="text-gray-700">{distanceData.distance.text} - {formData.tripType === 'oneway' ? 'One Way' : 'Return'}</span>
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">{formData.date || 'Date not set'}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">{formData.time || 'Time not set'}</span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">{formData.passengers} Passenger(s)</span>
            </div>
          </div>

          {/* Selected Vehicle Price */}
          {formData.selectedVehicle && vehicles.length > 0 && (
            <div className="border-t pt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Vehicle Type</span>
                <span className="text-sm font-medium">
                  {vehicles.find(v => v._id === formData.selectedVehicle)?.category || 'Economy'}
                </span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold">
                <span>TOTAL</span>
                <div className="text-right">
                  <p className="text-gray-900">
                    €{calculatePrice(vehicles.find(v => v._id === formData.selectedVehicle)!).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="border-t pt-3 space-y-2">
            <h4 className="font-semibold text-sm mb-2">Included Services</h4>
            <div className="space-y-2 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Door to Door</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Meet & Greet</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Instant booking confirmation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>No further costs</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span>Secure payment methods</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Easy cancellation</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="border-t pt-3">
            <div className="flex justify-center gap-2 flex-wrap opacity-70">
              <Image src="/visa.webp" alt="Visa" width={35} height={25} className="h-6 w-auto" />
              <Image src="/mastercard.webp" alt="MasterCard" width={35} height={25} className="h-6 w-auto" />
              <Image src="/paypal.webp" alt="PayPal" width={35} height={25} className="h-6 w-auto" />
              <Image src="/twint.webp" alt="Twint" width={35} height={25} className="h-6 w-auto" />
              <Image src="/applepay.webp" alt="Apple Pay" width={35} height={25} className="h-6 w-auto" />
            </div>
          </div>

          {/* Support */}
          <div className="border-t pt-3 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="h-4 w-4 text-gray-500" />
              <a href="mailto:booking@swissride-sarl.ch" className="hover:text-primary">
                booking@swissride-sarl.ch
              </a>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4 text-gray-500" />
              <a href="tel:+41763868121" className="hover:text-primary">
                +41 76 3868121
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
