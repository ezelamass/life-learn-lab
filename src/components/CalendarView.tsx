
import { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarBlocks, setCalendarBlocks] = useState([]);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [newBlock, setNewBlock] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  const fetchCalendarData = async () => {
    try {
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Get calendar blocks
      const { data: blocks, error: blocksError } = await supabase
        .from('calendar_blocks')
        .select('*')
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0])
        .order('start_time', { ascending: true });

      if (blocksError) throw blocksError;

      // Get completed lessons for the month
      const { data: progress, error: progressError } = await supabase
        .from('lesson_progress')
        .select(`
          *,
          lessons!inner(
            title,
            courses!inner(title)
          )
        `)
        .gte('completed_at', firstDay.toISOString())
        .lt('completed_at', new Date(lastDay.getTime() + 24 * 60 * 60 * 1000).toISOString());

      if (progressError) throw progressError;

      setCalendarBlocks(blocks || []);
      setCompletedLessons(progress || []);

    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast({
        title: "Error",
        description: "Failed to load calendar data",
        variant: "destructive"
      });
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getBlocksForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return calendarBlocks.filter(block => block.date === dateStr);
  };

  const getLessonsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return completedLessons.filter(lesson => {
      const lessonDate = new Date(lesson.completed_at).toISOString().split('T')[0];
      return lessonDate === dateStr;
    });
  };

  const handleAddBlock = async () => {
    if (!selectedDate || !newBlock.title || !newBlock.start_time || !newBlock.end_time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('calendar_blocks')
        .insert([{
          ...newBlock,
          date: selectedDate.toISOString().split('T')[0]
        }]);

      if (error) throw error;

      setNewBlock({
        title: '',
        description: '',
        start_time: '',
        end_time: ''
      });
      setIsDialogOpen(false);
      setSelectedDate(null);
      fetchCalendarData();

      toast({
        title: "Success",
        description: "Study block added successfully!",
      });

    } catch (error) {
      console.error('Error adding calendar block:', error);
      toast({
        title: "Error",
        description: "Failed to add study block",
        variant: "destructive"
      });
    }
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Study Calendar</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Study Block
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Add Study Block</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="block-title" className="text-gray-300">Title *</Label>
                <Input
                  id="block-title"
                  value={newBlock.title}
                  onChange={(e) => setNewBlock({...newBlock, title: e.target.value})}
                  placeholder="Study session title"
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="block-description" className="text-gray-300">Description</Label>
                <Input
                  id="block-description"
                  value={newBlock.description}
                  onChange={(e) => setNewBlock({...newBlock, description: e.target.value})}
                  placeholder="What will you study?"
                  className="bg-gray-700 border-gray-600 text-white mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time" className="text-gray-300">Start Time *</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={newBlock.start_time}
                    onChange={(e) => setNewBlock({...newBlock, start_time: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="end-time" className="text-gray-300">End Time *</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={newBlock.end_time}
                    onChange={(e) => setNewBlock({...newBlock, end_time: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                  />
                </div>
              </div>

              {selectedDate && (
                <p className="text-sm text-gray-400">
                  Date: {selectedDate.toLocaleDateString()}
                </p>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddBlock}>
                  Add Block
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {getDaysInMonth().map((date, index) => (
              <div
                key={index}
                className={`min-h-[120px] p-2 border border-gray-700 rounded-lg ${
                  date ? 'bg-gray-700 cursor-pointer hover:bg-gray-600' : 'bg-gray-800'
                }`}
                onClick={() => {
                  if (date) {
                    setSelectedDate(date);
                    setIsDialogOpen(true);
                  }
                }}
              >
                {date && (
                  <>
                    <div className="text-sm font-medium text-white mb-2">
                      {date.getDate()}
                    </div>
                    
                    {/* Study Blocks */}
                    {getBlocksForDate(date).map(block => (
                      <div key={block.id} className="bg-blue-600 text-white text-xs p-1 rounded mb-1 truncate">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {block.start_time} - {block.title}
                      </div>
                    ))}
                    
                    {/* Completed Lessons */}
                    {getLessonsForDate(date).map(lesson => (
                      <div key={lesson.id} className="bg-green-600 text-white text-xs p-1 rounded mb-1 truncate">
                        ✓ {lesson.lessons.title}
                      </div>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarView;
