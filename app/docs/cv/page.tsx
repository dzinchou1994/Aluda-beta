'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Brain } from 'lucide-react';

interface LanguageSkill {
  name: string;
  level: 'Beginner' | 'Elementary' | 'Intermediate' | 'Advanced' | 'Native' | 'Fluent';
}

interface Link {
  type: 'linkedin' | 'website' | 'github' | 'portfolio' | 'custom';
  label: string;
  url: string;
}

interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface LanguageSkillsInputProps {
  languages: LanguageSkill[];
  onAddLanguage: (name: string, level: LanguageSkill['level']) => void;
  onRemoveLanguage: (index: number) => void;
  onUpdateLanguageLevel: (index: number, level: LanguageSkill['level']) => void;
  popularLanguages: string[];
}

interface SmartSkillsInputProps {
  skills: string[];
  onAddSkill: (skill: string) => void;
  onRemoveSkill: (index: number) => void;
  skillCategories: Record<string, string[]>;
}

interface LinksInputProps {
  links: Link[];
  onAddLink: (link: Link) => void;
  onRemoveLink: (index: number) => void;
  onUpdateLink: (index: number, link: Link) => void;
}

interface ExperienceInputProps {
  experiences: ExperienceItem[];
  onAddExperience: (experience: ExperienceItem) => void;
  onUpdateExperience: (index: number, experience: ExperienceItem) => void;
  onRemoveExperience: (index: number) => void;
}

interface EducationInputProps {
  educations: EducationItem[];
  onAddEducation: (education: EducationItem) => void;
  onUpdateEducation: (index: number, education: EducationItem) => void;
  onRemoveEducation: (index: number) => void;
}

const LanguageSkillsInput: React.FC<LanguageSkillsInputProps> = ({
  languages,
  onAddLanguage,
  onRemoveLanguage,
  onUpdateLanguageLevel,
  popularLanguages
}) => {
  const [newLanguage, setNewLanguage] = useState('');
  const [newLevel, setNewLevel] = useState<LanguageSkill['level']>('Intermediate');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredLanguages = popularLanguages.filter(lang =>
    lang.toLowerCase().includes(newLanguage.toLowerCase()) &&
    !languages.some(existing => existing.name.toLowerCase() === lang.toLowerCase())
  );

  const handleAddLanguage = () => {
    if (newLanguage.trim()) {
      onAddLanguage(newLanguage, newLevel);
      setNewLanguage('');
      setShowSuggestions(false);
    }
  };

  const handleLanguageSelect = (language: string) => {
    setNewLanguage(language);
    setShowSuggestions(false);
  };

  const getLevelColor = (level: LanguageSkill['level']) => {
    const colors = {
      'Beginner': 'bg-red-100 text-red-800',
      'Elementary': 'bg-orange-100 text-orange-800',
      'Intermediate': 'bg-yellow-100 text-yellow-800',
      'Advanced': 'bg-blue-100 text-blue-800',
      'Native': 'bg-green-100 text-green-800',
      'Fluent': 'bg-green-100 text-green-800'
    };
    return colors[level];
  };

  const getLevelBars = (level: LanguageSkill['level']) => {
    const levelMap = { 'Beginner': 1, 'Elementary': 2, 'Intermediate': 3, 'Advanced': 4, 'Native': 5, 'Fluent': 5 };
    const filled = levelMap[level];
    return Array.from({length: 5}, (_, i) => (
      <div
        key={i}
        className={`w-3 h-1.5 rounded-full transition-colors ${
          i < filled ? 'bg-blue-500' : 'bg-slate-200'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-4">
      {/* Add new language */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={newLanguage}
            onChange={(e) => {
              setNewLanguage(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            onFocus={() => setShowSuggestions(newLanguage.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="შეიყვანეთ ენის სახელი..."
          />
          {showSuggestions && filteredLanguages.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredLanguages.slice(0, 8).map((language, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleLanguageSelect(language)}
                  className="w-full px-4 py-2 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                >
                  {language}
                </button>
              ))}
            </div>
          )}
        </div>
        <select
          value={newLevel}
          onChange={(e) => setNewLevel(e.target.value as LanguageSkill['level'])}
          className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="Beginner">დამწყები</option>
          <option value="Elementary">ელემენტარული</option>
          <option value="Intermediate">საშუალო</option>
          <option value="Advanced">მაღალი</option>
          <option value="Fluent">თავისუფალი</option>
          <option value="Native">მშობლიური</option>
        </select>
        <button
          type="button"
          onClick={handleAddLanguage}
          disabled={!newLanguage.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Language list */}
      {languages.length > 0 && (
        <div className="space-y-3">
          {languages.map((language, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-slate-800">{language.name}</span>
                  <div className="flex space-x-1">
                    {getLevelBars(language.level)}
                  </div>
                </div>
                <select
                  value={language.level}
                  onChange={(e) => onUpdateLanguageLevel(index, e.target.value as LanguageSkill['level'])}
                  className="px-3 py-1 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="Beginner">დამწყები</option>
                  <option value="Elementary">ელემენტარული</option>
                  <option value="Intermediate">საშუალო</option>
                  <option value="Advanced">მაღალი</option>
                  <option value="Fluent">თავისუფალი</option>
                  <option value="Native">მშობლიური</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => onRemoveLanguage(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {languages.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <p className="text-sm">დაამატეთ ენის უნარები</p>
        </div>
      )}
    </div>
  );
};

const SmartSkillsInput: React.FC<SmartSkillsInputProps> = ({
  skills,
  onAddSkill,
  onRemoveSkill,
  skillCategories
}) => {
  const [newSkill, setNewSkill] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Technical');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  // Get all skills from all categories
  const allSkills = Object.values(skillCategories).flat();

  const filteredSkills = allSkills.filter(skill =>
    skill.toLowerCase().includes(newSkill.toLowerCase()) &&
    !(Array.isArray(skills) && skills.some(existing => existing.toLowerCase() === skill.toLowerCase()))
  );

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      onAddSkill(newSkill.trim());
      setNewSkill('');
      setShowSuggestions(false);
    }
  };

  const handleSkillSelect = (skill: string) => {
    setNewSkill(skill);
    setShowSuggestions(false);
  };

  const handleCategorySkillSelect = (skill: string) => {
    onAddSkill(skill);
    setShowCategories(false);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Technical': 'bg-blue-100 text-blue-800 border-blue-200',
      'Design': 'bg-purple-100 text-purple-800 border-purple-200',
      'Soft Skills': 'bg-green-100 text-green-800 border-green-200',
      'Business': 'bg-orange-100 text-orange-800 border-orange-200',
      'Other': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category as keyof typeof colors] || colors['Other'];
  };

  return (
    <div className="space-y-4">
      {/* Add new skill input */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => {
              setNewSkill(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            onFocus={() => setShowSuggestions(newSkill.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="შეიყვანეთ უნარი..."
          />
          {showSuggestions && filteredSkills.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredSkills.slice(0, 8).map((skill, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSkillSelect(skill)}
                  className="w-full px-4 py-2 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                >
                  {skill}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddSkill}
          disabled={!newSkill.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Category-based skill selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-slate-700">პოპულარული უნარები</h4>
          <button
            type="button"
            onClick={() => setShowCategories(!showCategories)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>{showCategories ? 'დამალვა' : 'ნახვა'}</span>
            <svg 
              className={`w-4 h-4 transition-transform ${showCategories ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {showCategories && (
          <div className="space-y-4">
            {Object.entries(skillCategories).map(([category, categorySkills]) => (
              <div key={category} className="space-y-2">
                <h5 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  {category}
                </h5>
                <div className="flex flex-wrap gap-2">
                  {categorySkills.slice(0, 8).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleCategorySkillSelect(skill)}
                      disabled={Array.isArray(skills) && skills.some(existing => existing.toLowerCase() === skill.toLowerCase())}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        Array.isArray(skills) && skills.some(existing => existing.toLowerCase() === skill.toLowerCase())
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : `${getCategoryColor(category)} hover:opacity-80 cursor-pointer`
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills list */}
      {skills.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700">თქვენი უნარები</h4>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg border border-slate-200"
              >
                <span className="text-sm font-medium text-slate-800">{skill}</span>
                <button
                  type="button"
                  onClick={() => onRemoveSkill(index)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {skills.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-sm">დაამატეთ თქვენი უნარები</p>
        </div>
      )}
    </div>
  );
};

const LinksInput: React.FC<LinksInputProps> = ({
  links,
  onAddLink,
  onRemoveLink,
  onUpdateLink
}) => {
  const [newLink, setNewLink] = useState<Link>({
    type: 'linkedin',
    label: '',
    url: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const linkTypes = [
    { value: 'linkedin', label: 'LinkedIn', icon: '💼', placeholder: 'https://linkedin.com/in/username' },
    { value: 'website', label: 'Personal Website', icon: '🌐', placeholder: 'https://yourwebsite.com' },
    { value: 'github', label: 'GitHub', icon: '💻', placeholder: 'https://github.com/username' },
    { value: 'portfolio', label: 'Portfolio', icon: '🎨', placeholder: 'https://portfolio.com' },
    { value: 'custom', label: 'Custom', icon: '🔗', placeholder: 'https://example.com' }
  ];

  const getLinkIcon = (type: string) => {
    const linkType = linkTypes.find(lt => lt.value === type);
    return linkType ? linkType.icon : '🔗';
  };

  const getLinkLabel = (type: string) => {
    const linkType = linkTypes.find(lt => lt.value === type);
    return linkType ? linkType.label : 'Custom';
  };

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddLink = () => {
    if (newLink.url.trim() && validateUrl(newLink.url.trim())) {
      const linkToAdd = {
        ...newLink,
        url: newLink.url.trim(),
        label: newLink.type === 'custom' ? newLink.label.trim() : getLinkLabel(newLink.type)
      };
      onAddLink(linkToAdd);
      setNewLink({ type: 'linkedin', label: '', url: '' });
      setShowAddForm(false);
    }
  };

  const handleTypeChange = (type: Link['type']) => {
    setNewLink(prev => ({
      ...prev,
      type,
      label: type === 'custom' ? prev.label : ''
    }));
  };

  return (
    <div className="space-y-4">
      {/* Add new link form */}
      {showAddForm && (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-700">ახალი ლინკის დამატება</h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">ტიპი</label>
              <select
                value={newLink.type}
                onChange={(e) => handleTypeChange(e.target.value as Link['type'])}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {linkTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            {newLink.type === 'custom' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ლეიბლი</label>
                <input
                  type="text"
                  value={newLink.label}
                  onChange={(e) => setNewLink(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="მაგ: Twitter, Instagram"
                />
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">URL</label>
            <input
              type="url"
              value={newLink.url}
              onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={linkTypes.find(lt => lt.value === newLink.type)?.placeholder}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              გაუქმება
            </button>
            <button
              type="button"
              onClick={handleAddLink}
              disabled={!newLink.url.trim() || !validateUrl(newLink.url.trim())}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              დამატება
            </button>
          </div>
        </div>
      )}

      {/* Add link button */}
      {!showAddForm && (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">ლინკის დამატება</span>
        </button>
      )}

      {/* Links list */}
      {links.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700">თქვენი ლინკები</h4>
          <div className="space-y-2">
            {links.map((link, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getLinkIcon(link.type)}</span>
                  <div>
                    <div className="text-sm font-medium text-slate-800">{link.label}</div>
                    <div className="text-xs text-slate-500 truncate max-w-xs">{link.url}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveLink(index)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {links.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-slate-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <p className="text-sm">დაამატეთ თქვენი ლინკები</p>
        </div>
      )}
    </div>
  );
};

const ExperienceInput: React.FC<ExperienceInputProps> = ({
  experiences,
  onAddExperience,
  onUpdateExperience,
  onRemoveExperience
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExperience, setNewExperience] = useState<ExperienceItem>({
    id: '',
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: ''
  });

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleAddExperience = () => {
    if (newExperience.title.trim() && newExperience.company.trim() && newExperience.startDate) {
      const experienceToAdd = {
        ...newExperience,
        id: generateId(),
        endDate: newExperience.isCurrent ? '' : newExperience.endDate
      };
      onAddExperience(experienceToAdd);
      setNewExperience({
        id: '',
        title: '',
        company: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: ''
      });
      setShowAddForm(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ka-GE', { year: 'numeric', month: 'long' });
  };

  const getCurrentYear = () => new Date().getFullYear();
  const getYears = () => {
    const currentYear = getCurrentYear();
    return Array.from({ length: 50 }, (_, i) => currentYear - i);
  };

  const getMonths = () => [
    { value: '01', label: 'იანვარი' },
    { value: '02', label: 'თებერვალი' },
    { value: '03', label: 'მარტი' },
    { value: '04', label: 'აპრილი' },
    { value: '05', label: 'მაისი' },
    { value: '06', label: 'ივნისი' },
    { value: '07', label: 'ივლისი' },
    { value: '08', label: 'აგვისტო' },
    { value: '09', label: 'სექტემბერი' },
    { value: '10', label: 'ოქტომბერი' },
    { value: '11', label: 'ნოემბერი' },
    { value: '12', label: 'დეკემბერი' }
  ];

  return (
    <div className="space-y-4">
      {/* Add new experience form */}
      {showAddForm && (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-700">ახალი სამუშაო გამოცდილების დამატება</h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">პოზიცია *</label>
              <input
                type="text"
                value={newExperience.title}
                onChange={(e) => setNewExperience(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="მაგ: Frontend Developer"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">კომპანია *</label>
              <input
                type="text"
                value={newExperience.company}
                onChange={(e) => setNewExperience(prev => ({ ...prev, company: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="მაგ: Tech Company Ltd"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">დაწყების თვე</label>
              <select
                value={newExperience.startDate.split('-')[1] || ''}
                onChange={(e) => {
                  const year = newExperience.startDate.split('-')[0] || getCurrentYear().toString();
                  setNewExperience(prev => ({ ...prev, startDate: `${year}-${e.target.value}` }));
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">თვე</option>
                {getMonths().map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">დაწყების წელი</label>
              <select
                value={newExperience.startDate.split('-')[0] || ''}
                onChange={(e) => {
                  const month = newExperience.startDate.split('-')[1] || '';
                  setNewExperience(prev => ({ ...prev, startDate: `${e.target.value}-${month}` }));
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">წელი</option>
                {getYears().map(year => (
                  <option key={year} value={year.toString()}>{year}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center space-x-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={newExperience.isCurrent}
                  onChange={(e) => setNewExperience(prev => ({ ...prev, isCurrent: e.target.checked, endDate: '' }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>ამჟამად ვმუშაობ</span>
              </label>
            </div>
          </div>

          {!newExperience.isCurrent && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">დასრულების თვე</label>
                <select
                  value={newExperience.endDate.split('-')[1] || ''}
                  onChange={(e) => {
                    const year = newExperience.endDate.split('-')[0] || '';
                    setNewExperience(prev => ({ ...prev, endDate: `${year}-${e.target.value}` }));
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">თვე</option>
                  {getMonths().map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">დასრულების წელი</label>
                <select
                  value={newExperience.endDate.split('-')[0] || ''}
                  onChange={(e) => {
                    const month = newExperience.endDate.split('-')[1] || '';
                    setNewExperience(prev => ({ ...prev, endDate: `${e.target.value}-${month}` }));
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">წელი</option>
                  {getYears().map(year => (
                    <option key={year} value={year.toString()}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">აღწერა</label>
            <textarea
              value={newExperience.description}
              onChange={(e) => setNewExperience(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="მოკლე აღწერა თქვენი მოვალეობებისა და მიღწევების შესახებ..."
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              გაუქმება
            </button>
            <button
              type="button"
              onClick={handleAddExperience}
              disabled={!newExperience.title.trim() || !newExperience.company.trim() || !newExperience.startDate}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              დამატება
            </button>
          </div>
        </div>
      )}

      {/* Add experience button */}
      {!showAddForm && (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">სამუშაო გამოცდილების დამატება</span>
        </button>
      )}

      {/* Experience list */}
      {experiences.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700">თქვენი სამუშაო გამოცდილება</h4>
          <div className="space-y-3">
            {experiences.map((experience, index) => (
              <div key={experience.id} className="p-4 bg-white rounded-lg border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h5 className="font-semibold text-slate-800">{experience.title}</h5>
                    <p className="text-sm text-slate-600">{experience.company}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(experience.startDate)} - {experience.isCurrent ? 'ამჟამად' : formatDate(experience.endDate)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveExperience(index)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                {experience.description && (
                  <p className="text-sm text-slate-700 mt-2">{experience.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {experiences.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-slate-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
          </svg>
          <p className="text-sm">დაამატეთ თქვენი სამუშაო გამოცდილება</p>
        </div>
      )}
    </div>
  );
};

const EducationInput: React.FC<EducationInputProps> = ({
  educations,
  onAddEducation,
  onUpdateEducation,
  onRemoveEducation
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEducation, setNewEducation] = useState<EducationItem>({
    id: '',
    degree: '',
    institution: '',
    startDate: '',
    endDate: '',
    description: ''
  });

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleAddEducation = () => {
    if (newEducation.degree.trim() && newEducation.institution.trim() && newEducation.startDate && newEducation.endDate) {
      const educationToAdd = {
        ...newEducation,
        id: generateId()
      };
      onAddEducation(educationToAdd);
      setNewEducation({
        id: '',
        degree: '',
        institution: '',
        startDate: '',
        endDate: '',
        description: ''
      });
      setShowAddForm(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ka-GE', { year: 'numeric', month: 'long' });
  };

  const getCurrentYear = () => new Date().getFullYear();
  const getYears = () => {
    const currentYear = getCurrentYear();
    return Array.from({ length: 50 }, (_, i) => currentYear - i);
  };

  const getMonths = () => [
    { value: '01', label: 'იანვარი' },
    { value: '02', label: 'თებერვალი' },
    { value: '03', label: 'მარტი' },
    { value: '04', label: 'აპრილი' },
    { value: '05', label: 'მაისი' },
    { value: '06', label: 'ივნისი' },
    { value: '07', label: 'ივლისი' },
    { value: '08', label: 'აგვისტო' },
    { value: '09', label: 'სექტემბერი' },
    { value: '10', label: 'ოქტომბერი' },
    { value: '11', label: 'ნოემბერი' },
    { value: '12', label: 'დეკემბერი' }
  ];

  return (
    <div className="space-y-4">
      {/* Add new education form */}
      {showAddForm && (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-700">ახალი განათლების დამატება</h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">ხარისხი/სპეციალობა *</label>
              <input
                type="text"
                value={newEducation.degree}
                onChange={(e) => setNewEducation(prev => ({ ...prev, degree: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="მაგ: კომპიუტერული მეცნიერება"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">სასწავლებელი *</label>
              <input
                type="text"
                value={newEducation.institution}
                onChange={(e) => setNewEducation(prev => ({ ...prev, institution: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="მაგ: თბილისის სახელმწიფო უნივერსიტეტი"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">დაწყების თვე</label>
              <select
                value={newEducation.startDate.split('-')[1] || ''}
                onChange={(e) => {
                  const year = newEducation.startDate.split('-')[0] || '';
                  setNewEducation(prev => ({ ...prev, startDate: `${year}-${e.target.value}` }));
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">თვე</option>
                {getMonths().map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">დაწყების წელი</label>
              <select
                value={newEducation.startDate.split('-')[0] || ''}
                onChange={(e) => {
                  const month = newEducation.startDate.split('-')[1] || '';
                  setNewEducation(prev => ({ ...prev, startDate: `${e.target.value}-${month}` }));
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">წელი</option>
                {getYears().map(year => (
                  <option key={year} value={year.toString()}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">დასრულების თვე</label>
              <select
                value={newEducation.endDate.split('-')[1] || ''}
                onChange={(e) => {
                  const year = newEducation.endDate.split('-')[0] || '';
                  setNewEducation(prev => ({ ...prev, endDate: `${year}-${e.target.value}` }));
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">თვე</option>
                {getMonths().map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">დასრულების წელი</label>
              <select
                value={newEducation.endDate.split('-')[0] || ''}
                onChange={(e) => {
                  const month = newEducation.endDate.split('-')[1] || '';
                  setNewEducation(prev => ({ ...prev, endDate: `${e.target.value}-${month}` }));
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">წელი</option>
                {getYears().map(year => (
                  <option key={year} value={year.toString()}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">აღწერა</label>
            <textarea
              value={newEducation.description}
              onChange={(e) => setNewEducation(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="მოკლე აღწერა თქვენი სწავლის შესახებ..."
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              გაუქმება
            </button>
            <button
              type="button"
              onClick={handleAddEducation}
              disabled={!newEducation.degree.trim() || !newEducation.institution.trim() || !newEducation.startDate || !newEducation.endDate}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              დამატება
            </button>
          </div>
        </div>
      )}

      {/* Add education button */}
      {!showAddForm && (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">განათლების დამატება</span>
        </button>
      )}

      {/* Education list */}
      {educations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700">თქვენი განათლება</h4>
          <div className="space-y-3">
            {educations.map((education, index) => (
              <div key={education.id} className="p-4 bg-white rounded-lg border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h5 className="font-semibold text-slate-800">{education.degree}</h5>
                    <p className="text-sm text-slate-600">{education.institution}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(education.startDate)} - {formatDate(education.endDate)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveEducation(index)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                {education.description && (
                  <p className="text-sm text-slate-700 mt-2">{education.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {educations.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-slate-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
          <p className="text-sm">დაამატეთ თქვენი განათლება</p>
        </div>
      )}
    </div>
  );
};

interface CVData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  links: Link[];
  summary: string;
  experience: string; // Keep for backward compatibility
  education: string; // Keep for backward compatibility
  experiences: ExperienceItem[]; // New structured data
  educations: EducationItem[]; // New structured data
  skills: string[];
  languages: LanguageSkill[];
  picture: string;
}

// localStorage utility functions
const STORAGE_KEY = 'cv-generator-data';

const saveToLocalStorage = (data: CVData) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save CV data to localStorage:', error);
  }
};

const loadFromLocalStorage = (): CVData | null => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      // Migrate old skills format (string) to new format (array)
      if (data.skills && typeof data.skills === 'string') {
        data.skills = data.skills
          .split(/[,\n]/)
          .map((s: string) => s.trim())
          .filter(Boolean);
      }
      
      // Migrate old linkedin format (string) to new links format (array)
      if (data.linkedin && typeof data.linkedin === 'string' && data.linkedin.trim()) {
        data.links = [{
          type: 'linkedin',
          label: 'LinkedIn',
          url: data.linkedin.trim()
        }];
        delete data.linkedin;
      } else if (!data.links) {
        data.links = [];
      }
      
      // Initialize new structured data fields if they don't exist
      if (!data.experiences) {
        data.experiences = [];
      }
      if (!data.educations) {
        data.educations = [];
      }
      
      return data;
    }
  } catch (error) {
    console.warn('Failed to load CV data from localStorage:', error);
  }
  return null;
};

const clearLocalStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear CV data from localStorage:', error);
  }
};

export default function CVGeneratorPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
  // Initialize state with data from localStorage or default values
  const [cvData, setCvData] = useState<CVData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    links: [],
    summary: '',
    experience: '',
    education: '',
    experiences: [],
    educations: [],
    skills: [],
    languages: [],
    picture: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCV, setGeneratedCV] = useState<string>('');
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [previewZoom, setPreviewZoom] = useState(0.5);
  const [cvTemplate, setCvTemplate] = useState<'minimal' | 'classic'>('minimal');

  // Popular languages for autocomplete
  const popularLanguages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Chinese', 'Japanese', 'Korean',
    'Arabic', 'Hindi', 'Bengali', 'Urdu', 'Turkish', 'Polish', 'Dutch', 'Swedish', 'Norwegian', 'Danish',
    'Finnish', 'Greek', 'Hebrew', 'Thai', 'Vietnamese', 'Indonesian', 'Malay', 'Filipino', 'Georgian', 'Armenian',
    'Azerbaijani', 'Ukrainian', 'Romanian', 'Bulgarian', 'Croatian', 'Serbian', 'Slovak', 'Czech', 'Hungarian',
    'Lithuanian', 'Latvian', 'Estonian', 'Slovenian', 'Macedonian', 'Albanian', 'Moldovan', 'Belarusian'
  ];

  // Popular skills by category
  const skillCategories = {
    'Technical': [
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift',
      'React', 'Vue.js', 'Angular', 'Node.js', 'Express.js', 'Django', 'Flask', 'Laravel',
      'HTML', 'CSS', 'SASS', 'TypeScript', 'jQuery', 'Bootstrap', 'Tailwind CSS',
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle',
      'Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'Linux', 'Windows'
    ],
    'Design': [
      'Photoshop', 'Illustrator', 'Figma', 'Sketch', 'Adobe XD', 'InDesign', 'Canva',
      'UI/UX Design', 'Web Design', 'Graphic Design', 'Logo Design', 'Branding',
      'Wireframing', 'Prototyping', 'User Research', 'Design Systems'
    ],
    'Soft Skills': [
      'Leadership', 'Teamwork', 'Communication', 'Problem Solving', 'Critical Thinking',
      'Time Management', 'Project Management', 'Negotiation', 'Presentation Skills',
      'Customer Service', 'Adaptability', 'Creativity', 'Analytical Skills'
    ],
    'Business': [
      'Marketing', 'Sales', 'Business Development', 'Strategic Planning', 'Financial Analysis',
      'Data Analysis', 'Market Research', 'Digital Marketing', 'SEO', 'SEM',
      'Social Media Marketing', 'Content Marketing', 'Email Marketing', 'CRM'
    ],
    'Other': [
      'Microsoft Office', 'Excel', 'PowerPoint', 'Word', 'Google Workspace',
      'Slack', 'Trello', 'Asana', 'Jira', 'Confluence', 'Notion'
    ]
  };

  // Approximate A4 size at 96 DPI
  const a4WidthPx = 794; // 210mm @ ~96dpi
  const a4HeightPx = 1123; // 297mm @ ~96dpi

  // Initialize client-side and load data from localStorage
  useEffect(() => {
    setIsClient(true);
    const savedData = loadFromLocalStorage();
    if (savedData) {
      // Ensure skills is always an array
      if (!Array.isArray(savedData.skills)) {
        savedData.skills = [];
      }
      setCvData(savedData);
    }
  }, []);

  // Auto-save to localStorage whenever cvData changes (only on client)
  useEffect(() => {
    if (isClient) {
      saveToLocalStorage(cvData);
    }
  }, [cvData, isClient]);

  const handleInputChange = (field: keyof CVData, value: string) => {
    setCvData(prev => ({ ...prev, [field]: value }));
  };

  const handlePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCvData(prev => ({ ...prev, picture: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePicture = () => {
    setCvData(prev => ({ ...prev, picture: '' }));
  };

  const addLanguage = (name: string, level: LanguageSkill['level']) => {
    if (name.trim() && !cvData.languages.some(lang => lang.name.toLowerCase() === name.toLowerCase())) {
      setCvData(prev => ({
        ...prev,
        languages: [...prev.languages, { name: name.trim(), level }]
      }));
    }
  };

  const removeLanguage = (index: number) => {
    setCvData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  const updateLanguageLevel = (index: number, level: LanguageSkill['level']) => {
    setCvData(prev => ({
      ...prev,
      languages: prev.languages.map((lang, i) => i === index ? { ...lang, level } : lang)
    }));
  };

  const addSkill = (skill: string) => {
    if (skill.trim() && Array.isArray(cvData.skills) && !cvData.skills.some(existing => existing.toLowerCase() === skill.toLowerCase())) {
      setCvData(prev => ({
        ...prev,
        skills: [...(Array.isArray(prev.skills) ? prev.skills : []), skill.trim()]
      }));
    }
  };

  const removeSkill = (index: number) => {
    setCvData(prev => ({
      ...prev,
      skills: Array.isArray(prev.skills) ? prev.skills.filter((_, i) => i !== index) : []
    }));
  };

  const addLink = (link: Link) => {
    setCvData(prev => ({
      ...prev,
      links: [...prev.links, link]
    }));
  };

  const removeLink = (index: number) => {
    setCvData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  const updateLink = (index: number, link: Link) => {
    setCvData(prev => ({
      ...prev,
      links: prev.links.map((l, i) => i === index ? link : l)
    }));
  };

  const addExperience = (experience: ExperienceItem) => {
    setCvData(prev => ({
      ...prev,
      experiences: [...prev.experiences, experience]
    }));
  };

  const updateExperience = (index: number, experience: ExperienceItem) => {
    setCvData(prev => ({
      ...prev,
      experiences: prev.experiences.map((exp, i) => i === index ? experience : exp)
    }));
  };

  const removeExperience = (index: number) => {
    setCvData(prev => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index)
    }));
  };

  const addEducation = (education: EducationItem) => {
    setCvData(prev => ({
      ...prev,
      educations: [...prev.educations, education]
    }));
  };

  const updateEducation = (index: number, education: EducationItem) => {
    setCvData(prev => ({
      ...prev,
      educations: prev.educations.map((edu, i) => i === index ? education : edu)
    }));
  };

  const removeEducation = (index: number) => {
    setCvData(prev => ({
      ...prev,
      educations: prev.educations.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    if (confirm('ნამდვილად გსურთ ყველა მონაცემის წაშლა? ეს მოქმედება შეუქცევადია.')) {
      const defaultData: CVData = {
        fullName: '',
        email: '',
        phone: '',
        address: '',
        links: [],
        summary: '',
        experience: '',
        education: '',
        experiences: [],
        educations: [],
        skills: [],
        languages: [],
        picture: ''
      };
      setCvData(defaultData);
      clearLocalStorage();
      setGeneratedCV('');
    }
  };

  const generateLivePreview = () => {
    return createCVHTML(cvData, cvTemplate);
  };

  const generateCV = async () => {
    if (!cvData.fullName || !cvData.email || !cvData.phone) {
      alert('გთხოვ თ შეავსოთ ყველა სავალდებულო ველი');
      return;
    }

    setIsGenerating(true);
    
    // Simulate generation process
    setTimeout(() => {
      const cvHTML = createCVHTML(cvData, cvTemplate);
      setGeneratedCV(cvHTML);
      setIsGenerating(false);
      // Clear localStorage after successful generation
      clearLocalStorage();
    }, 2000);
  };

  const createCVHTML = (data: CVData, template: 'minimal' | 'classic') => {
    const skillItems = data.skills || [];
    
    // Use structured data if available, otherwise fall back to text data
    const experienceItems = data.experiences && data.experiences.length > 0 
      ? data.experiences.map(exp => {
          const startDate = exp.startDate ? new Date(exp.startDate).toLocaleDateString('ka-GE', { year: 'numeric', month: 'long' }) : '';
          const endDate = exp.isCurrent ? 'ამჟამად' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString('ka-GE', { year: 'numeric', month: 'long' }) : '');
          const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : '';
          return `${exp.title} at ${exp.company}${dateRange ? ` (${dateRange})` : ''}${exp.description ? ` - ${exp.description}` : ''}`;
        })
      : (data.experience || '')
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean);
    
    const educationItems = data.educations && data.educations.length > 0
      ? data.educations.map(edu => {
          const startDate = edu.startDate ? new Date(edu.startDate).toLocaleDateString('ka-GE', { year: 'numeric', month: 'long' }) : '';
          const endDate = edu.endDate ? new Date(edu.endDate).toLocaleDateString('ka-GE', { year: 'numeric', month: 'long' }) : '';
          const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : '';
          return `${edu.degree} at ${edu.institution}${dateRange ? ` (${dateRange})` : ''}${edu.description ? ` - ${edu.description}` : ''}`;
        })
      : (data.education || '')
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>CV - ${data.fullName}</title>
        <style>
          :root { --text: #0f172a; --muted: #475569; --border: #e2e8f0; --bg: #ffffff; --subtle: #f8fafc; --accent: #2563eb; --font: 'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, 'Apple Color Emoji', 'Segoe UI Emoji'; }
          body.t-minimal { --text: #0f172a; --muted: #475569; --border: #e2e8f0; --bg: #ffffff; --subtle: #f8fafc; --accent: #2563eb; --font: 'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; }
          body.t-classic { --text: #111827; --muted: #4b5563; --border: #e5e7eb; --bg: #ffffff; --subtle: #ffffff; --accent: #111827; --font: Georgia, 'Times New Roman', serif; }
          /* art template removed */
          * { box-sizing: border-box; }
          body { font-family: var(--font); margin: 0; padding: 24px; background: var(--bg); color: var(--text); line-height: 1.6; }
          .cv-page { max-width: 800px; margin: 0 auto; background: #fff; }
          .cv-header { padding-bottom: 20px; border-bottom: 1px solid var(--border); text-align: center; background: #ffffff; }
          .cv-photo { margin-bottom: 16px; display: inline-flex; align-items: center; justify-content: center; }
          .cv-photo img { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 2px solid #e5e7eb; }
          .cv-name { margin: 0 0 8px 0; font-size: 34px; letter-spacing: -0.02em; }
          .contact-info { display: flex; justify-content: center; flex-wrap: wrap; gap: 16px; color: var(--muted); font-size: 14px; }
          .cv-section { padding: 18px 0; border-bottom: 1px solid var(--border); }
          .cv-section:last-child { border-bottom: 0; }
          .cv-section h2 { margin: 0 0 10px 0; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
          .cv-section p { margin: 8px 0; color: var(--text); }
          ul.clean { margin: 8px 0; padding-left: 18px; }
          ul.clean li { margin: 6px 0; }
          .chips { display: flex; flex-wrap: wrap; gap: 8px; }
          .chip { display: inline-block; padding: 6px 10px; border-radius: 9999px; background: var(--subtle); border: 1px solid var(--border); font-size: 13px; color: var(--text); }
          .placeholder { color: #94a3b8; }
          .placeholder-block { background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px; }
          .languages-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
          .language-item { display: flex; flex-direction: column; gap: 8px; }
          .language-name { font-weight: 600; color: var(--text); font-size: 14px; }
          .language-level { display: flex; align-items: center; gap: 12px; }
          .level-bars { display: flex; gap: 3px; }
          .level-bar { width: 12px; height: 4px; border-radius: 2px; background: var(--border); transition: background-color 0.2s; }
          .level-bar.filled { background: var(--accent); }
          .level-text { font-size: 12px; color: var(--muted); font-weight: 500; }
          /* Classic tweaks */
          .t-classic .cv-header { text-align: left; padding-bottom: 12px; border-bottom: 2px solid var(--accent); }
          .t-classic .cv-name { font-size: 36px; letter-spacing: 0; }
          .t-classic .contact-info { justify-content: flex-start; gap: 12px; font-style: italic; }
          .t-classic .cv-section { padding: 20px 0; border-bottom: 1px solid var(--border); }
          .t-classic .cv-section h2 { font-variant: small-caps; letter-spacing: 0.12em; color: var(--text); }
          /* art template removed */
          @media print {
            @page { size: A4; margin: 16mm; }
            html, body, .cv-page { background: #ffffff !important; }
            body { padding: 0 !important; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body class="t-${template}">
        <div class="cv-page">
          <div class="cv-header">
            ${data.picture ? `<div class="cv-photo"><img src="${data.picture}" alt="Profile Photo"></div>` : ''}
            <h1 class="cv-name">${data.fullName || 'თქვენი სრული სახელი'}</h1>
            <div class="contact-info">
              <span>${data.email || '<span class="placeholder">ელ-ფოსტა</span>'}</span>
              <span>${data.phone || '<span class="placeholder">ტელეფონი</span>'}</span>
              <span>${data.address || '<span class="placeholder">მისამართი</span>'}</span>
              ${data.links && data.links.length > 0 ? data.links.map(link => `<span><a href="${link.url}" target="_blank" class="text-blue-600 hover:text-blue-800">${link.label}</a></span>`).join('') : ''}
            </div>
          </div>

          <div class="cv-section cv-summary">
            <h2>შენს შესახებ</h2>
            ${data.summary ? `<p>${data.summary}</p>` : `<div class="placeholder-block"><p class="placeholder">მოკლე შეჯამება თქვენი გამოცდილებისა და მიზნების შესახებ...</p></div>`}
          </div>

          <div class="cv-section cv-experience">
            <h2>გამოცდილება</h2>
            ${experienceItems.length ? `<ul class="clean">${experienceItems.map(i => `<li>${i}</li>`).join('')}</ul>` : `<div class="placeholder-block"><p class="placeholder">დაამატეთ თქვენი სამუშაო გამოცდილება, როლები და მიღწევები...</p></div>`}
          </div>

          <div class="cv-section cv-education">
            <h2>განათლება</h2>
            ${educationItems.length ? `<ul class="clean">${educationItems.map(i => `<li>${i}</li>`).join('')}</ul>` : `<div class="placeholder-block"><p class="placeholder">დაამატეთ სასწავლებლები, ხარისხები და თარიღები...</p></div>`}
          </div>

          <div class="cv-section cv-skills">
            <h2>უნარები</h2>
            ${skillItems.length ? `<div class="chips">${skillItems.map(s => `<span class="chip">${s}</span>`).join('')}</div>` : `<div class="placeholder-block"><p class="placeholder">ჩამოთვალეთ თქვენი ძირითადი ტექნიკური და რბილი უნარები...</p></div>`}
          </div>

          <div class="cv-section cv-languages">
            <h2>ენები</h2>
            ${data.languages && data.languages.length ? `
              <div class="languages-grid">
                ${data.languages.map(lang => `
                  <div class="language-item">
                    <div class="language-name">${lang.name}</div>
                    <div class="language-level">
                      <div class="level-bars">
                        ${Array.from({length: 5}, (_, i) => {
                          const levelMap = { 'Beginner': 1, 'Elementary': 2, 'Intermediate': 3, 'Advanced': 4, 'Native': 5, 'Fluent': 5 };
                          const filled = i < levelMap[lang.level];
                          return `<div class="level-bar ${filled ? 'filled' : ''}"></div>`;
                        }).join('')}
                      </div>
                      <span class="level-text">${lang.level}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `<div class="placeholder-block"><p class="placeholder">დაამატეთ თქვენი ენის უნარები და მათი დონე...</p></div>`}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const downloadPDFViaAPI = async (html: string, suggestedName: string) => {
    const name = (suggestedName && suggestedName.trim()) || 'CV';
    const response = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, fileName: name })
    });
    if (!response.ok) {
      throw new Error('PDF API returned non-OK');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCVFromPreview = async () => {
    try {
      console.log('Generating PDF from Live Preview via API...');
      
      // Check if there's any meaningful content
      if (!cvData.fullName && !cvData.email && !cvData.phone) {
        alert('გთხოვთ შეავსოთ მინიმუმ სახელი, ელ-ფოსტა და ტელეფონი PDF-ის ჩამოტვირთვისთვის.');
        return;
      }
      
      const cvHTML = generateLivePreview();
      console.log('Generated HTML length:', cvHTML.length);
      await downloadPDFViaAPI(cvHTML, cvData.fullName || 'CV');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('შეცდომა PDF-ის გენერაციისას. გთხოვთ სცადოთ კვლავ.');
    }
  };

  const createSimplifiedHTMLForPDF = (data: CVData) => {
    const skillItems = data.skills || [];
    
    // Use structured data if available, otherwise fall back to text data
    const experienceItems = data.experiences && data.experiences.length > 0 
      ? data.experiences.map(exp => {
          const startDate = exp.startDate ? new Date(exp.startDate).toLocaleDateString('ka-GE', { year: 'numeric', month: 'long' }) : '';
          const endDate = exp.isCurrent ? 'ამჟამად' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString('ka-GE', { year: 'numeric', month: 'long' }) : '');
          const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : '';
          return `${exp.title} at ${exp.company}${dateRange ? ` (${dateRange})` : ''}${exp.description ? ` - ${exp.description}` : ''}`;
        })
      : (data.experience || '')
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean);
    
    const educationItems = data.educations && data.educations.length > 0
      ? data.educations.map(edu => {
          const startDate = edu.startDate ? new Date(edu.startDate).toLocaleDateString('ka-GE', { year: 'numeric', month: 'long' }) : '';
          const endDate = edu.endDate ? new Date(edu.endDate).toLocaleDateString('ka-GE', { year: 'numeric', month: 'long' }) : '';
          const dateRange = startDate && endDate ? `${startDate} - ${endDate}` : '';
          return `${edu.degree} at ${edu.institution}${dateRange ? ` (${dateRange})` : ''}${edu.description ? ` - ${edu.description}` : ''}`;
        })
      : (data.education || '')
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean);

    return `
      <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #000; max-width: 800px; margin: 0 auto; background: white; padding: 24px;">
        <!-- Header -->
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #ccc;">
          ${data.picture ? `<div style="margin-bottom: 16px;"><img src="${data.picture}" alt="Profile Photo" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #ccc;"></div>` : ''}
          <h1 style="margin: 0 0 8px 0; font-size: 34px; color: #000;">${data.fullName || 'თქვენი სრული სახელი'}</h1>
          <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 16px; color: #666; font-size: 14px;">
            <span>${data.email || 'ელ-ფოსტა'}</span>
            <span>${data.phone || 'ტელეფონი'}</span>
            <span>${data.address || 'მისამართი'}</span>
            ${data.links && data.links.length > 0 ? data.links.map(link => `<span>${link.label}: ${link.url}</span>`).join('') : ''}
          </div>
        </div>

        <!-- About -->
        <div style="padding: 18px 0; border-bottom: 1px solid #ccc;">
          <h2 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #666;">შენს შესახებ</h2>
          ${data.summary ? `<p style="margin: 8px 0; color: #000;">${data.summary}</p>` : `<p style="margin: 8px 0; color: #999;">მოკლე შეჯამება თქვენი გამოცდილებისა და მიზნების შესახებ...</p>`}
        </div>

        <!-- Experience -->
        <div style="padding: 18px 0; border-bottom: 1px solid #ccc;">
          <h2 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #666;">გამოცდილება</h2>
          ${experienceItems.length ? `<ul style="margin: 8px 0; padding-left: 18px;">${experienceItems.map(i => `<li style="margin: 6px 0;">${i}</li>`).join('')}</ul>` : `<p style="margin: 8px 0; color: #999;">დაამატეთ თქვენი სამუშაო გამოცდილება...</p>`}
        </div>

        <!-- Education -->
        <div style="padding: 18px 0; border-bottom: 1px solid #ccc;">
          <h2 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #666;">განათლება</h2>
          ${educationItems.length ? `<ul style="margin: 8px 0; padding-left: 18px;">${educationItems.map(i => `<li style="margin: 6px 0;">${i}</li>`).join('')}</ul>` : `<p style="margin: 8px 0; color: #999;">დაამატეთ თქვენი განათლება...</p>`}
        </div>

        <!-- Skills -->
        <div style="padding: 18px 0; border-bottom: 1px solid #ccc;">
          <h2 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #666;">უნარები</h2>
          ${skillItems.length ? `<div style="display: flex; flex-wrap: wrap; gap: 8px;">${skillItems.map(s => `<span style="display: inline-block; padding: 6px 10px; border-radius: 9999px; background: #f1f5f9; border: 1px solid #e2e8f0; font-size: 13px; color: #000;">${s}</span>`).join('')}</div>` : `<p style="margin: 8px 0; color: #999;">ჩამოთვალეთ თქვენი ძირითადი ტექნიკური და რბილი უნარები...</p>`}
        </div>

        <!-- Languages -->
        <div style="padding: 18px 0;">
          <h2 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #666;">ენები</h2>
          ${data.languages && data.languages.length ? `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
              ${data.languages.map(lang => `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <div style="font-weight: 600; color: #000; font-size: 14px;">${lang.name}</div>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="display: flex; gap: 3px;">
                      ${Array.from({length: 5}, (_, i) => {
                        const levelMap = { 'Beginner': 1, 'Elementary': 2, 'Intermediate': 3, 'Advanced': 4, 'Native': 5, 'Fluent': 5 };
                        const filled = i < levelMap[lang.level];
                        return `<div style="width: 12px; height: 4px; border-radius: 2px; background: ${filled ? '#2563eb' : '#e2e8f0'};"></div>`;
                      }).join('')}
                    </div>
                    <span style="font-size: 12px; color: #666; font-weight: 500;">${lang.level}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `<p style="margin: 8px 0; color: #999;">დაამატეთ თქვენი ენის უნარები და მათი დონე...</p>`}
        </div>
      </div>
    `;
  };

  const generatePDFFromHTML = async (htmlContent: string) => {
    
    console.log('Starting PDF generation...');
    console.log('HTML content length:', htmlContent.length);
    
    try {
      // Dynamic imports for better compatibility
      console.log('Loading PDF libraries...');
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);
      
      console.log('Libraries loaded successfully');

      // Create a simplified HTML structure for better PDF generation
      const simplifiedHTML = createSimplifiedHTMLForPDF(cvData);
      console.log('Simplified HTML created, length:', simplifiedHTML.length);

      // Create a temporary container for the CV content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = simplifiedHTML;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '794px'; // A4 width in pixels
      tempDiv.style.minHeight = '1123px'; // A4 height in pixels
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.fontFamily = 'Arial, sans-serif'; // Use simpler font
      tempDiv.style.lineHeight = '1.6';
      tempDiv.style.color = '#000000'; // Use black for better contrast
      tempDiv.style.padding = '24px';
      tempDiv.style.boxSizing = 'border-box';
      tempDiv.style.visibility = 'visible';
      tempDiv.style.opacity = '1';
      tempDiv.style.fontSize = '14px'; // Ensure font size is set
      document.body.appendChild(tempDiv);
      
      console.log('Temporary div created and added to DOM');
      console.log('Div content length:', tempDiv.innerHTML.length);
      console.log('Div has content:', (tempDiv.textContent?.length || 0) > 0);

      // Wait a bit for the DOM to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Created temporary div, converting to canvas...');

      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
        logging: true, // Enable logging to see what's happening
        foreignObjectRendering: true,
        removeContainer: false,
        imageTimeout: 10000, // Increase timeout
        onclone: (clonedDoc) => {
          console.log('Cloning document for html2canvas');
          // Ensure styles are properly applied in the cloned document
          const clonedDiv = clonedDoc.querySelector('div');
          if (clonedDiv) {
            clonedDiv.style.width = '794px';
            clonedDiv.style.minHeight = '1123px';
            clonedDiv.style.backgroundColor = 'white';
            clonedDiv.style.padding = '24px';
            clonedDiv.style.boxSizing = 'border-box';
            clonedDiv.style.visibility = 'visible';
            clonedDiv.style.opacity = '1';
            clonedDiv.style.fontFamily = 'Arial, sans-serif';
            clonedDiv.style.fontSize = '14px';
            clonedDiv.style.color = '#000000';
            console.log('Cloned div styled, content length:', clonedDiv.textContent?.length);
          }
        }
      });
      
      console.log('Canvas created successfully');
      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);

      console.log('Canvas created, removing temp div...');

      // Remove temporary element
      document.body.removeChild(tempDiv);

      console.log('Creating PDF...');

      // Create PDF
      const imgData = canvas.toDataURL('image/png', 1.0); // High quality
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm (corrected)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      console.log('PDF created, downloading...');

      // Download PDF
      const fileName = `${cvData.fullName || 'CV'}.pdf`;
      pdf.save(fileName);
      
      console.log('PDF download completed successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      console.log('Falling back to HTML download...');
      
      // Fallback to HTML download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CV-${cvData.fullName || 'Document'}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const downloadCV = async () => {
    if (!generatedCV) {
      alert('CV არ არის გენერირებული. გთხოვთ ჯერ გენერირება დააჭიროთ.');
      return;
    }
    try {
      console.log('Generating PDF from generated CV via API...');
      await downloadPDFViaAPI(generatedCV, cvData.fullName || 'CV');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('შეცდომა PDF-ის გენერაციისას. გთხოვთ სცადოთ კვლავ.');
    }
  };

  const printCV = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatedCV);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (generatedCV) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Sticky Download Button */}
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={downloadCV}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>PDF ჩამოტვირთვა</span>
          </button>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setGeneratedCV('')}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>უკან</span>
            </button>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadCV}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">ჩამოტვირთვა</span>
                <span className="sm:hidden">Download</span>
              </button>
              <button
                onClick={printCV}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span className="hidden sm:inline">ბეჭდვა</span>
                <span className="sm:hidden">Print</span>
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <iframe
              srcDoc={generatedCV}
              className="w-full h-screen border-0"
              title="Generated CV"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* Back Button */}
          <div className="mb-4">
            <button
              onClick={() => router.push('/docs')}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>უკან</span>
            </button>
          </div>
          
          {/* Title */}
          <div className="flex items-center gap-2 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">CV გენერატორი</h1>
            <span className="text-[9px] font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white px-1.5 py-0.5 rounded-full">BETA</span>
          </div>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
            
            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Template Selector - Mobile Friendly */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-slate-600 whitespace-nowrap">Template:</label>
                <select
                  value={cvTemplate}
                  onChange={(e) => setCvTemplate(e.target.value as 'minimal' | 'classic')}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="minimal">Minimalistic</option>
                  <option value="classic">Classic</option>
                </select>
              </div>
              
              {/* Reset Button */}
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm sm:text-base">Reset</span>
              </button>
              
              {/* Live Preview Button */}
              <button
                type="button"
                onClick={() => setShowLivePreview(!showLivePreview)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  showLivePreview 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm sm:text-base">ცოცხალი გადახედვა</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className={`mx-auto ${showLivePreview ? 'max-w-7xl' : 'max-w-4xl'}`}>
          <div className={`${showLivePreview ? 'grid grid-cols-1 lg:grid-cols-2 gap-8 items-start' : ''}`}>
            <div className={`bg-white rounded-xl shadow-lg p-8 ${showLivePreview ? 'max-h-[800px] overflow-y-auto' : ''}`}>
            <form onSubmit={(e) => { e.preventDefault(); generateCV(); }} className="space-y-6">
              {/* Picture Upload */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  პროფილის ფოტო
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {isClient && cvData.picture ? (
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-300">
                        <img
                          src={cvData.picture}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePictureUpload}
                      className="hidden"
                      id="picture-upload"
                    />
                    <label
                      htmlFor="picture-upload"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm"
                    >
                      ფოტოს არჩევა
                    </label>
                    {isClient && cvData.picture && (
                      <button
                        type="button"
                        onClick={removePicture}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        წაშლა
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">ატვირთეთ თქვენი პროფესიონალური ფოტო (არასავალდებულო)</p>
              </div>

              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    სრული სახელი *
                  </label>
                  <input
                    type="text"
                    value={cvData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="შეიყვანეთ თქვენი სრული სახელი"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    ელ-ფოსტა *
                  </label>
                  <input
                    type="email"
                    value={cvData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="example@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    ტელეფონი *
                  </label>
                  <input
                    type="tel"
                    value={cvData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+995 555 123 456"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    მისამართი
                  </label>
                  <input
                    type="text"
                    value={cvData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="თბილისი, საქართველო"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    ლინკები
                  </label>
                  <LinksInput 
                    links={cvData.links}
                    onAddLink={addLink}
                    onRemoveLink={removeLink}
                    onUpdateLink={updateLink}
                  />
                </div>
              </div>

              {/* About You */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  შენს შესახებ
                </label>
                <textarea
                  value={cvData.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="მოკლე აღწერა თქვენი პროფესიონალური გამოცდილებისა და მიზნების შესახებ..."
                />
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  გამოცდილება
                </label>
                <ExperienceInput 
                  experiences={cvData.experiences}
                  onAddExperience={addExperience}
                  onUpdateExperience={updateExperience}
                  onRemoveExperience={removeExperience}
                />
              </div>

              {/* Education */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  განათლება
                </label>
                <EducationInput 
                  educations={cvData.educations}
                  onAddEducation={addEducation}
                  onUpdateEducation={updateEducation}
                  onRemoveEducation={removeEducation}
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  უნარები
                </label>
                <SmartSkillsInput 
                  skills={cvData.skills}
                  onAddSkill={addSkill}
                  onRemoveSkill={removeSkill}
                  skillCategories={skillCategories}
                />
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  ენები
                </label>
                <LanguageSkillsInput 
                  languages={cvData.languages}
                  onAddLanguage={addLanguage}
                  onRemoveLanguage={removeLanguage}
                  onUpdateLanguageLevel={updateLanguageLevel}
                  popularLanguages={popularLanguages}
                />
              </div>

              {/* Generate Button */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>გენერირება...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>CV-ის გენერირება</span>
                    </>
                  )}
                </button>
              </div>
            </form>
            </div>
            
            {/* Live Preview Panel */}
            {showLivePreview && (
              <div className="bg-white rounded-xl shadow-lg p-8 max-h-[800px] flex flex-col lg:sticky lg:top-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-slate-800">ცოცხალი გადახედვა</h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setPreviewZoom(z => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}
                        className="px-2 py-1 text-slate-700 hover:bg-slate-100"
                        aria-label="Zoom out"
                      >
                        −
                      </button>
                      <div className="px-3 py-1 text-sm tabular-nums text-slate-700">{Math.round(previewZoom * 100)}%</div>
                      <button
                        type="button"
                        onClick={() => setPreviewZoom(z => Math.min(2, Math.round((z + 0.1) * 10) / 10))}
                        className="px-2 py-1 text-slate-700 hover:bg-slate-100"
                        aria-label="Zoom in"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={downloadCVFromPreview}
                      className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>PDF ჩამოტვირთვა</span>
                    </button>
                  </div>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-auto flex-1 bg-slate-50">
                  <div
                    className="mx-auto my-4"
                    style={{ width: `${Math.round(a4WidthPx * previewZoom)}px`, height: `${Math.round(a4HeightPx * previewZoom)}px` }}
                  >
                    <iframe
                      srcDoc={generateLivePreview()}
                      title="Live CV Preview"
                      style={{
                        width: `${a4WidthPx}px`,
                        height: `${a4HeightPx}px`,
                        border: '0',
                        transform: `scale(${previewZoom})`,
                        transformOrigin: 'top left',
                        background: 'white',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}