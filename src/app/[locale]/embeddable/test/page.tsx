"use client";

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ExternalLink, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmbeddableTestPage() {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const testCases = [
    {
      title: "Direct to Step 2 - Full Parameters",
      description: "Opens vehicle selection with complete trip details pre-filled",
      url: "/en/embeddable?step=2&pickup=Zurich%20Airport&dropoff=Geneva%20City%20Center&date=2025-10-20&time=14:00&passengers=2&tripType=oneway",
      params: {
        step: "2",
        pickup: "Zurich Airport",
        dropoff: "Geneva City Center",
        date: "2025-10-20",
        time: "14:00",
        passengers: "2",
        tripType: "oneway"
      }
    },
    {
      title: "Direct to Step 2 - Airport to City",
      description: "Pre-configured airport transfer",
      url: "/en/embeddable?step=2&pickup=Geneva%20Airport&dropoff=Lausanne&date=2025-10-25&time=10:30&passengers=3",
      params: {
        step: "2",
        pickup: "Geneva Airport",
        dropoff: "Lausanne",
        date: "2025-10-25",
        time: "10:30",
        passengers: "3"
      }
    },
    {
      title: "Step 1 with Pre-filled Locations",
      description: "Start at trip details with locations pre-filled",
      url: "/en/embeddable?pickup=Bern%20Train%20Station&dropoff=Basel%20Airport&passengers=4",
      params: {
        pickup: "Bern Train Station",
        dropoff: "Basel Airport",
        passengers: "4"
      }
    },
    {
      title: "Direct to Step 2 - Minimal",
      description: "Jump to vehicle selection without pre-filled data",
      url: "/en/embeddable?step=2",
      params: {
        step: "2"
      }
    },
    {
      title: "Round Trip - Pre-configured",
      description: "Return journey with full details",
      url: "/en/embeddable?step=2&pickup=Zurich&dropoff=Milan&date=2025-11-01&time=08:00&passengers=2&tripType=return",
      params: {
        step: "2",
        pickup: "Zurich",
        dropoff: "Milan",
        date: "2025-11-01",
        time: "08:00",
        passengers: "2",
        tripType: "return"
      }
    },
    {
      title: "Default (No Parameters)",
      description: "Standard booking flow from Step 1",
      url: "/en/embeddable",
      params: {}
    }
  ];

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(window.location.origin + text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Embeddable Form Test Cases</h1>
          <p className="text-gray-600">
            Test different URL parameter combinations for the booking form. Click &quot;Open&quot; to test in a new tab, or &quot;Copy URL&quot; to get the full link.
          </p>
        </div>

        {/* Documentation Link */}
        <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Documentation Available</h3>
              <p className="text-sm text-gray-700 mb-3">
                For complete documentation on how to use URL parameters and embed the form on external websites, 
                check the <code className="bg-white px-2 py-0.5 rounded text-blue-600">EMBEDDABLE_FORM_USAGE.md</code> file 
                in the project root.
              </p>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">iFrame Examples</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">WordPress Integration</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">React Component</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">JavaScript SDK</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Test Cases Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {testCases.map((testCase, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{testCase.title}</h3>
                <p className="text-sm text-gray-600">{testCase.description}</p>
              </div>

              {/* Parameters Display */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Parameters:</h4>
                {Object.keys(testCase.params).length > 0 ? (
                  <div className="space-y-1">
                    {Object.entries(testCase.params).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-blue-600">{key}:</span>
                        <span className="font-mono text-gray-700">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">No parameters (default behavior)</p>
                )}
              </div>

              {/* URL Display */}
              <div className="bg-gray-900 rounded-lg p-3 mb-4 overflow-x-auto">
                <code className="text-xs text-green-400 break-all">
                  {testCase.url}
                </code>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link href={testCase.url} target="_blank" className="flex-1">
                  <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Test
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(testCase.url, index)}
                  className="flex-shrink-0"
                >
                  {copiedIndex === index ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* iFrame Example */}
        <Card className="p-6 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Live iFrame Example</h2>
          <p className="text-gray-600 mb-4">
            Below is a live example of the embeddable form with pre-filled parameters:
          </p>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-4 overflow-x-auto">
            <code className="text-xs text-gray-800 break-all">
              {`<iframe src="${window.location.origin}/en/embeddable?step=2&pickup=Zurich%20Airport&dropoff=Geneva" width="100%" height="900px" frameborder="0"></iframe>`}
            </code>
          </div>

          <div className="border-4 border-gray-300 rounded-lg overflow-hidden">
            <iframe 
              src="/en/embeddable?step=2&pickup=Zurich%20Airport&dropoff=Geneva%20City%20Center&date=2025-10-20&time=14:00&passengers=2"
              width="100%" 
              height="900px" 
              style={{ border: 'none' }}
              title="Embeddable Form Demo"
            />
          </div>
        </Card>

        {/* Quick Reference */}
        <Card className="p-6 mt-8 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Reference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Available Parameters</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li><code className="bg-white px-2 py-0.5 rounded">step</code> - Step number (1, 2, or 3)</li>
                <li><code className="bg-white px-2 py-0.5 rounded">pickup</code> - Pickup location</li>
                <li><code className="bg-white px-2 py-0.5 rounded">dropoff</code> - Dropoff location</li>
                <li><code className="bg-white px-2 py-0.5 rounded">date</code> - Date (YYYY-MM-DD)</li>
                <li><code className="bg-white px-2 py-0.5 rounded">time</code> - Time (HH:MM)</li>
                <li><code className="bg-white px-2 py-0.5 rounded">passengers</code> - Number (1-8)</li>
                <li><code className="bg-white px-2 py-0.5 rounded">tripType</code> - oneway or return</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Use Cases</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✅ Deep linking from marketing emails</li>
                <li>✅ Pre-filled forms from partner websites</li>
                <li>✅ Airport transfer quick booking</li>
                <li>✅ Hotel concierge integration</li>
                <li>✅ Travel agency white-label solution</li>
                <li>✅ Mobile app web view integration</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
