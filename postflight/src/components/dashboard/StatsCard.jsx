import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

const colorClasses = {
  blue: "bg-primary/10 text-primary",
  green: "bg-secondary/10 text-secondary",
  purple: "bg-secondary/10 text-secondary",
  orange: "bg-accent/10 text-accent",
  cyan: "bg-primary/10 text-primary",
};

export default function StatsCard({ title, value, icon: Icon, color, subtitle }) {
  return (
    <Card className="bg-card shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}