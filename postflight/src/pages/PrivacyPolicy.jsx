
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileLock } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileLock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold text-slate-900">Privacy Policy</CardTitle>
                <CardDescription className="text-slate-600 mt-1">Last Updated: {new Date().toLocaleDateString()}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 text-slate-700 prose prose-slate max-w-none">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-primary mb-3">Your Data, Your Rights</h3>
              <p className="text-slate-700 leading-relaxed">
                At PostFlight.io, we believe in complete data transparency and user control. <strong>You own all of your data.</strong> 
                Your flight logs, personal information, and usage data belong to you entirely. We will never use your data for 
                commercial purposes, sell it to third parties, or monetize it in any way. You maintain full control and can 
                delete your data at any time through your account settings.
              </p>
            </div>

            <p className="text-lg text-slate-600 leading-relaxed">
              PostFlight.io is committed to protecting your privacy and ensuring you maintain complete control over your aviation data. 
              This Privacy Policy explains how we collect, use, protect, and respect your information when you use our flight logging application.
            </p>

            <h3 className="text-2xl font-bold text-slate-800 border-b-2 border-primary/20 pb-3 mt-8">1. Data Ownership</h3>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
              <p className="font-medium text-green-800 mb-2">Your Data Belongs to You</p>
              <ul className="text-green-700 space-y-1">
                <li>• You retain full ownership of all flight data, personal information, and content you create</li>
                <li>• PostFlight.io acts solely as a secure storage and processing service for your data</li>
                <li>• We have no claim, right, or ownership over any of your information</li>
                <li>• Your data remains yours regardless of how long you use our service</li>
              </ul>
            </div>

            <h3 className="text-2xl font-bold text-slate-800 border-b-2 border-primary/20 pb-3 mt-8">2. Information We Collect</h3>
            <p>We collect only the information necessary to provide our flight logging services:</p>
            
            <div className="grid md:grid-cols-2 gap-4 my-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-2">Personal Information</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Name and contact information</li>
                  <li>• Pilot license details</li>
                  <li>• Military rank or civilian title</li>
                  <li>• Unit or organization affiliation</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-2">Flight Data</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Flight dates, times, and hours</li>
                  <li>• Aircraft information and routes</li>
                  <li>• Mission types and conditions</li>
                  <li>• Personal notes and remarks</li>
                </ul>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-slate-800 border-b-2 border-primary/20 pb-3 mt-8">3. How We Use Your Information</h3>
            <p>We use your information exclusively to provide and improve our flight logging services:</p>
            <div className="bg-blue-50 rounded-lg p-4 my-4">
              <ul className="text-slate-700 space-y-2">
                <li>• <strong>Service Provision:</strong> Create and maintain your account and flight logs</li>
                <li>• <strong>Data Processing:</strong> Generate reports, track currency, and calculate totals</li>
                <li>• <strong>Service Improvement:</strong> Analyze usage patterns to enhance functionality (anonymized data only)</li>
                <li>• <strong>Communication:</strong> Send important service updates and security notifications</li>
                <li>• <strong>Support:</strong> Provide technical assistance when you contact us</li>
              </ul>
            </div>

            <h3 className="text-2xl font-bold text-slate-800 border-b-2 border-primary/20 pb-3 mt-8">4. Commercial Use Prohibition</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-semibold text-red-800 mb-2">We Will Never:</p>
              <ul className="text-red-700 space-y-1">
                <li>• Sell, rent, lease, or trade your personal data to any third party</li>
                <li>• Use your flight data for commercial purposes or profit</li>
                <li>• Share your information with advertisers or marketing companies</li>
                <li>• Create commercial products or services based on your data</li>
                <li>• Monetize your information in any way without your explicit consent</li>
              </ul>
            </div>

            <h3 className="text-2xl font-bold text-slate-800 border-b-2 border-primary/20 pb-3 mt-8">5. Data Sharing and Disclosure</h3>
            <p>Your data privacy is paramount. We only share information in these limited circumstances:</p>
            
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-slate-800">Within Organizations</h4>
                <p className="text-sm text-slate-600">When you join an aviation organization in our platform, flight data associated with that organization's aircraft may be visible to other members for collaborative tracking and reporting purposes.</p>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-semibold text-slate-800">Legal Requirements</h4>
                <p className="text-sm text-slate-600">We may disclose information when required by law, legal process, or to protect the rights, property, and safety of PostFlight.io, our users, or others.</p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-slate-800">Service Providers</h4>
                <p className="text-sm text-slate-600">We may share data with trusted service providers who assist in operating our platform, subject to strict confidentiality agreements.</p>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-slate-800 border-b-2 border-primary/20 pb-3 mt-8">6. Your Data Rights</h3>
            <div className="bg-primary/5 rounded-lg p-4">
              <p className="font-semibold text-primary mb-3">You have complete control over your data:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-slate-800 mb-2">Access & Control</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• View all your stored data</li>
                    <li>• Edit or update information</li>
                    <li>• Export your data</li>
                    <li>• Control sharing settings</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 mb-2">Deletion Rights</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Delete individual flight entries</li>
                    <li>• Remove personal information</li>
                    <li>• Close your account entirely</li>
                    <li>• Request complete data deletion</li>
                  </ul>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-slate-800 border-b-2 border-primary/20 pb-3 mt-8">7. Data Security</h3>
            <p>We implement industry-standard security measures to protect your information:</p>
            <div className="bg-slate-50 rounded-lg p-4 my-4">
              <ul className="text-slate-700 space-y-2">
                <li>• <strong>Encryption:</strong> Data encrypted in transit and at rest</li>
                <li>• <strong>Access Controls:</strong> Strict authentication and authorization protocols</li>
                <li>• <strong>Regular Audits:</strong> Ongoing security assessments and updates</li>
                <li>• <strong>Secure Infrastructure:</strong> Enterprise-grade hosting and backup systems</li>
              </ul>
            </div>

            <h3 className="text-2xl font-bold text-slate-800 border-b-2 border-primary/20 pb-3 mt-8">8. Data Retention</h3>
            <p>
              We retain your data only as long as your account is active or as needed to provide services. 
              When you delete data or close your account, we ensure complete removal from our systems within 30 days, 
              except where retention is required by law.
            </p>

            <h3 className="text-2xl font-bold text-slate-800 border-b-2 border-primary/20 pb-3 mt-8">9. Children's Privacy</h3>
            <p>
              PostFlight.io is not intended for users under 13 years of age. We do not knowingly collect 
              personal information from children under 13. If we learn that we have collected such information, 
              we will delete it immediately.
            </p>

            <h3 className="text-2xl font-bold text-slate-800 border-b-2 border-primary/20 pb-3 mt-8">10. Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. 
              We will notify users of significant changes via email and prominent notice within the application. 
              Your continued use of PostFlight.io after such changes constitutes acceptance of the updated policy.
            </p>

            <h3 className="text-2xl font-bold text-slate-800 border-b-2 border-primary/20 pb-3 mt-8">11. Contact Information</h3>
            <div className="bg-slate-100 rounded-lg p-4">
              <p className="font-semibold text-slate-800 mb-2">Questions about this Privacy Policy?</p>
              <p className="text-slate-700">
                We're committed to transparency and are happy to address any concerns about your data privacy. 
                Contact us at:
              </p>
              <div className="mt-3 text-slate-700">
                <p><strong>Email:</strong> support{'@'}postflight.io</p>
                <p><strong>Subject Line:</strong> Privacy Policy Inquiry</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 mt-8 text-center">
              <p className="text-sm text-slate-500">
                © {new Date().getFullYear()} PostFlight.io - Your trusted aviation logbook platform
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
