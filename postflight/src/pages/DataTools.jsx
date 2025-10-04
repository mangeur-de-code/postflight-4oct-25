import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Info } from "lucide-react";

export default function DataTools() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Data Tools Moved
            </CardTitle>
            <CardDescription>
              Data tools are now available directly inside your Profile → Data tab.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-700">
              We consolidated all bulk edit and delete tools into the Data section of your Profile to keep everything in one place.
            </p>
            <Link to={createPageUrl("Profile")}>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Go to Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}