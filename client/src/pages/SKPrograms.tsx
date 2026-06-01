import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock3, MapPin } from "lucide-react";

const programs = [
  {
    title: "Youth Mental Health Week",
    date: "June 10, 2026",
    venue: "SK Covered Court, Centro 11",
    category: "Health",
    lead: "Committee on Health",
  },
  {
    title: "Skills-to-Work Bootcamp",
    date: "June 14, 2026",
    venue: "City Skills Lab",
    category: "Livelihood",
    lead: "Committee on Employment",
  },
  {
    title: "Campus Voter Education Forum",
    date: "June 21, 2026",
    venue: "West High Auditorium",
    category: "Civic",
    lead: "Committee on Governance",
  },
  {
    title: "Inter-Barangay E-Sports Cup",
    date: "June 28, 2026",
    venue: "Youth Activity Center",
    category: "Sports",
    lead: "Committee on Recreation",
  },
];

export default function SKPrograms() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SK Programs</h1>
          <p className="text-muted-foreground mt-1">
            Upcoming program calendar and lead committees.
          </p>
        </div>
        <Button variant="outline">
          <CalendarDays className="mr-2 h-4 w-4" />
          Export Calendar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {programs.map((program) => (
          <Card key={program.title} className="border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{program.title}</CardTitle>
                <Badge variant="secondary">{program.category}</Badge>
              </div>
              <CardDescription>{program.lead}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock3 className="h-4 w-4" />
                <span>{program.date}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{program.venue}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
