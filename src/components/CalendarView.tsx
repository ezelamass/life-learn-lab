import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Calendar as CalendarIcon, Clock, Repeat } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CalendarView = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [studyBlocks, setStudyBlocks] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringWeeks, setRecurringWeeks] = useState(1);
  const [selectedDays, setSelectedDays] = useState([]);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchStudyBlocks();
  }, [selectedDate]);

  const fetchStudyBlocks = async () => {
    if (!selectedDate) return;

    try {
      const { data, error } = await supabase
        .from('calendar_blocks')
        .select('*')
        .eq('date', selectedDate.toISOString().split('T')[0])
        .order('start_time');

      if (error) throw error;
      setStudyBlocks(data || []);
    } catch (error) {
      console.error('Error fetching study blocks:', error);
      toast({
        title: "Error",
        description: "Failed to load study blocks.",
        variant: "destructive"
      });
    }
  };

  const handleRecurringChange = (checked) => {
    setIsRecurring(checked === true);
  };

  const toggleDaySelection = (day) => {
    setSelectedDays(prevDays => {
      if (prevDays.includes(day)) {
        return prevDays.filter(d => d !== day);
      } else {
        return [...prevDays, day];
      }
    });
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    setIsRecurring(false);
    setRecurringWeeks(1);
    setSelectedDays([]);
  };

  const validateForm = () => {
    if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a title for the study block.",
        variant: "destructive"
      });
      return false;
    }

    if (!startTime) {
      toast({
        title: "Missing start time",
        description: "Please select a start time.",
        variant: "destructive"
      });
      return false;
    }

    if (!endTime) {
      toast({
        title: "Missing end time",
        description: "Please select an end time.",
        variant: "destructive"
      });
      return false;
    }

    if (startTime >= endTime) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive"
      });
      return false;
    }

    if (isRecurring && selectedDays.length === 0) {
      toast({
        title: "Missing recurring days",
        description: "Please select at least one day for recurring blocks.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleCreateStudyBlock = async () => {
    if (!selectedDate) {
      toast({
        title: "No date selected",
        description: "Please select a date first.",
        variant: "destructive"
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const blocksToCreate = [];

      if (isRecurring && selectedDays.length > 0) {
        // Create recurring blocks
        const dayMap = {
          'L': 1, 'M': 2, 'X': 3, 'J': 4, 'V': 5, 'S': 6, 'D': 0
        };

        for (let week = 0; week < recurringWeeks; week++) {
          for (const dayKey of selectedDays) {
            const targetDay = dayMap[dayKey];
            const currentDate = new Date(selectedDate);
            currentDate.setDate(currentDate.getDate() + (week * 7));
            
            // Adjust to the correct day of week
            const dayDiff = targetDay - currentDate.getDay();
            currentDate.setDate(currentDate.getDate() + dayDiff);

            blocksToCreate.push({
              title: title.trim(),
              description: description.trim() || null,
              date: currentDate.toISOString().split('T')[0],
              start_time: startTime,
              end_time: endTime
            });
          }
        }
      } else {
        // Create single block
        blocksToCreate.push({
          title: title.trim(),
          description: description.trim() || null,
          date: selectedDate.toISOString().split('T')[0],
          start_time: startTime,
          end_time: endTime
        });
      }

      const { error } = await supabase
        .from('calendar_blocks')
        .insert(blocksToCreate);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Created ${blocksToCreate.length} study block(s)!`,
      });

      resetForm();
      setIsDialogOpen(false);
      fetchStudyBlocks();
    } catch (error) {
      console.error('Error creating study block:', error);
      toast({
        title: "Error",
        description: "Failed to create study block. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteStudyBlock = async (blockId) => {
    try {
      const { error } = await supabase
        .from('calendar_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Study block deleted successfully!",
      });

      fetchStudyBlocks();
    } catch (error) {
      console.error('Error deleting study block:', error);
      toast({
        title: "Error",
        description: "Failed to delete study block.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Calendar</h2>
        <div className="text-gray-400">
          {selectedDate ? (
            <>
              <CalendarIcon className="h-4 w-4 mr-2 inline-block" />
              {selectedDate.toLocaleDateString()}
            </>
          ) : (
            "Select a date"
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border border-gray-600"
                classNames={{
                  day_selected: "bg-blue-600 text-white hover:bg-blue-700",
                  day_today: "bg-gray-600 text-white",
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {selectedDate && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Selected Date</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  {selectedDate.toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Create Study Block Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!selectedDate}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Study Block
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
              <DialogHeader>
                <DialogTitle>Create Study Block</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="blockTitle" className="text-gray-300">Title *</Label>
                  <Input
                    id="blockTitle"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Study session title..."
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="blockDescription" className="text-gray-300">Description</Label>
                  <Textarea
                    id="blockDescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What will you study?"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime" className="text-gray-300">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-gray-300">End Time *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recurring"
                      checked={isRecurring}
                      onCheckedChange={handleRecurringChange}
                    />
                    <Label htmlFor="recurring" className="text-gray-300">Make this recurring</Label>
                  </div>

                  {isRecurring && (
                    <div className="space-y-4 pl-6 border-l-2 border-gray-600">
                      <div>
                        <Label htmlFor="weeks" className="text-gray-300">Number of weeks</Label>
                        <Input
                          id="weeks"
                          type="number"
                          min="1"
                          max="52"
                          value={recurringWeeks}
                          onChange={(e) => setRecurringWeeks(parseInt(e.target.value) || 1)}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-gray-300 block mb-2">Repeat on days</Label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: 'L', label: 'Lun' },
                            { key: 'M', label: 'Mar' },
                            { key: 'X', label: 'Mié' },
                            { key: 'J', label: 'Jue' },
                            { key: 'V', label: 'Vie' },
                            { key: 'S', label: 'Sáb' },
                            { key: 'D', label: 'Dom' }
                          ].map((day) => (
                            <Button
                              key={day.key}
                              type="button"
                              variant={selectedDays.includes(day.key) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleDaySelection(day.key)}
                              className="w-12 h-8 p-0 text-xs"
                            >
                              {day.key}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button 
                    onClick={handleCreateStudyBlock}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Create Block
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      resetForm();
                      setIsDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Study Blocks Display */}
          {selectedDate && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Study Blocks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {studyBlocks.length === 0 ? (
                  <p className="text-gray-400">No study blocks for this day.</p>
                ) : (
                  <div className="space-y-3">
                    {studyBlocks.map((block) => (
                      <div key={block.id} className="bg-gray-700 rounded-md p-3">
                        <div className="flex justify-between items-center">
                          <h3 className="text-white font-semibold">{block.title}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStudyBlock(block.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Delete
                          </Button>
                        </div>
                        <p className="text-gray-400 text-sm">{block.description}</p>
                        <div className="flex items-center text-gray-500 text-sm mt-2">
                          <Clock className="h-4 w-4 mr-1" />
                          {block.start_time} - {block.end_time}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
