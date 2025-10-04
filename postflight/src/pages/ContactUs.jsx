
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, User as UserIcon, ExternalLink } from "lucide-react";

export default function ContactUsPage() {
  const [user, setUser] = useState(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (e) {
        console.error("Failed to fetch user, user might not be logged in.", e);
        // It's okay if the user is not logged in.
      }
    };
    fetchUser();
  }, []);

  const handleDirectEmail = () => {
    const emailSubject = encodeURIComponent(subject || "PostFlight.io Support Request");
    const emailBody = encodeURIComponent(message || "");
    const emailUser = "support";
    const emailDomain = "postflight.io";
    const fullEmail = `${emailUser}@${emailDomain}`;
    const mailtoLink = `mailto:${fullEmail}?subject=${emailSubject}&body=${emailBody}`;
    window.open(mailtoLink, '_self');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900">Contact Support</h1>
          <p className="text-slate-600 mt-1">
            Questions, feedback, or need help? Open your email client to send a message directly to our support team.
          </p>
        </div>

        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <ExternalLink className="w-5 h-5" />
              Compose Your Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {user && (
                <div className="p-4 bg-slate-50 rounded-lg flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Email will be sent from: {user.full_name}
                    </p>
                    <p className="text-xs text-slate-600">{user.email}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Feature Request, Bug Report, Question"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please describe your inquiry in detail here..."
                  className="min-h-40"
                />
              </div>
              
              <div className="text-center border-t pt-6">
                 <p className="text-sm text-slate-500 mb-4">
                    Your email will be sent to <span className="font-medium text-slate-700">support{'@'}postflight.io</span>
                </p>
                <Button onClick={handleDirectEmail} className="w-full md:w-auto">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Email Client to Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
