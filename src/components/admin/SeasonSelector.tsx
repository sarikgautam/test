import { useSeason } from "@/hooks/useSeason";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

export function SeasonSelector() {
  const { seasons, selectedSeasonId, setSelectedSeasonId, isLoading } = useSeason();

  if (isLoading) {
    return (
      <div className="h-9 w-40 animate-pulse bg-muted rounded-md" />
    );
  }

  return (
    <Select value={selectedSeasonId || ""} onValueChange={setSelectedSeasonId}>
      <SelectTrigger className="w-[180px]">
        <Calendar className="w-4 h-4 mr-2" />
        <SelectValue placeholder="Select season" />
      </SelectTrigger>
      <SelectContent>
        {seasons.map((season) => (
          <SelectItem key={season.id} value={season.id}>
            <div className="flex items-center gap-2">
              {season.name}
              {season.is_active && (
                <Badge variant="default" className="text-xs py-0 h-5">
                  Active
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
