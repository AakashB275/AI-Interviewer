import React, { useState } from 'react';
import { X, Briefcase, ArrowRight, Sparkles } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';

function JobRoleDialog({ isOpen, onClose, onConfirm }) {
  const [jobRole, setJobRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const popularRoles = [
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Data Scientist',
    'Product Manager',
    'DevOps Engineer',
    'UI/UX Designer',
    'Machine Learning Engineer',
    'Cloud Architect'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!jobRole.trim()) {
      alert('Please enter a job role');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(jobRole.trim());
    } catch (error) {
      console.error('Error submitting job role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setJobRole('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="max-w-md w-full max-h-[85vh] flex flex-col">
        <Card className="bg-white border border-gray-200 shadow-xl flex flex-col max-h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Briefcase className="text-blue-600" size={24} />
                </div>
                <div>
                  <CardTitle className="text-gray-900">Start Your Interview</CardTitle>
                  <CardDescription className="text-gray-600">
                    Tell us about the role you're interviewing for
                  </CardDescription>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="text-gray-600" size={20} />
              </button>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <CardContent className="space-y-4 overflow-y-auto flex-1">
              {/* Job Role Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Role <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="e.g., Software Engineer, Product Manager..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition text-sm"
                  required
                  autoFocus
                />
                
                {/* Popular Roles Suggestions */}
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-2">Popular roles:</p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {popularRoles.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setJobRole(role)}
                        className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-blue-100 text-black hover:text-blue-700 rounded-full transition-colors border border-gray-200 hover:border-blue-300"
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="text-blue-600 mt-0.5 flex-shrink-0" size={16} />
                  <div className="text-xs text-blue-800">
                    <p className="font-medium mb-1">Personalized Questions</p>
                    <p className="text-blue-700">
                      Based on your resume and the job role, we'll generate tailored interview questions. The difficulty will be automatically determined based on your experience level.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-2 pt-3 border-t border-gray-200 flex-shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!jobRole.trim() || isSubmitting}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Starting...
                  </>
                ) : (
                  <>
                    Start Interview
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default JobRoleDialog;
