import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone } from "lucide-react";

const officials = [
  {
    name: "Ariana M. Dela Cruz",
    role: "SK Chairperson",
    committee: "Executive",
    phone: "+63 917 123 4501",
    email: "ariana.delacruz@sk.local",
  },
  {
    name: "John Carlo R. Matias",
    role: "SK Kagawad",
    committee: "Education",
    phone: "+63 917 123 4502",
    email: "johncarlo.matias@sk.local",
  },
  {
    name: "Princess Anne B. Ramos",
    role: "SK Kagawad",
    committee: "Health",
    phone: "+63 917 123 4503",
    email: "princess.ramos@sk.local",
  },
  {
    name: "Miguel T. Javier",
    role: "SK Treasurer",
    committee: "Finance",
    phone: "+63 917 123 4504",
    email: "miguel.javier@sk.local",
  },
];

export default function SKOfficials() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SK Officials</h1>
        <p className="text-muted-foreground mt-1">
          Committee leads and key contacts for barangay youth governance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {officials.map((official) => (
          <Card key={official.email} className="border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border">
                  <AvatarFallback>
                    {official.name
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <CardTitle className="text-base truncate">{official.name}</CardTitle>
                  <CardDescription className="truncate">{official.role}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Badge variant="outline">{official.committee} Committee</Badge>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{official.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{official.email}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
