import React from 'react';
import { Bell } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="h-full p-8 text-white max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-2">Settings</h1>
      <p className="text-gray-400 mb-8">Manage your account preferences and notification settings.</p>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-indigo-400">
          <Bell className="w-5 h-5" />
          Notification Preferences
        </h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-white">Task Assignments</h4>
              <p className="text-sm text-gray-500">Notify me when I'm assigned or unassigned from a task.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-white">Mentions</h4>
              <p className="text-sm text-gray-500">Notify me when someone @mentions me in a comment.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-white">Project Activity</h4>
              <p className="text-sm text-gray-500">Notify me when I am added or removed from projects.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
