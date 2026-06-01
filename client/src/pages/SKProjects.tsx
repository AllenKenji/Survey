import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, FolderKanban } from "lucide-react";

const projects = [
  {
    name: "Youth Leadership Camp",
    barangay: "Centro 09",
    status: "In Progress",
    progress: 72,
    owner: "Committee on Education",
  },
  {
    name: "Basketball League Upgrade",
    barangay: "Atulayan Norte",
    status: "Planning",
    progress: 28,
    owner: "Committee on Sports",
  },
  {
    name: "Barangay Digital Literacy Hub",
    barangay: "Ugac Sur",
    status: "Completed",
    progress: 100,
    owner: "Committee on ICT",
  },
  {
    name: "Coastal Cleanup Drive",
    barangay: "Capatan",
    status: "In Progress",
    progress: 61,
    owner: "Committee on Environment",
  },
];

const statusVariant = (status: string) => {
  if (status === "Completed") return "default" as const;
  if (status === "In Progress") return "secondary" as const;
  return "outline" as const;
};

export default function SKProjects() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SK Projects</h1>
          <p className="text-muted-foreground mt-1">
            Priority initiatives managed by Sangguniang Kabataan committees.
          </p>
        </div>
        <Button>
          Add Project
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.name} className="border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-primary" />
                  {project.name}
                </CardTitle>
                <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
              </div>
              <CardDescription>{project.barangay}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} />
              </div>
              <p className="text-sm text-muted-foreground">
                Owner: <span className="text-foreground font-medium">{project.owner}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
