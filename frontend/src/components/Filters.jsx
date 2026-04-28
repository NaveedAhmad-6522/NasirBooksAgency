import {
    Layers,
    BookOpen,
    Book,
    GraduationCap,
    School,
    Library,
    ScrollText
  } from "lucide-react";
  
  function Filters({ category, setCategory }) {
    const categories = [
      { name: "All", icon: Layers },
      { name: "Primary", icon: BookOpen },
      { name: "Middle", icon: Book },
      { name: "Matric", icon: School },
      { name: "FSC", icon: Library },
      { name: "BS", icon: GraduationCap },
      { name: "Quran", icon: ScrollText },
    ];
  
    return (
      <div className="bg-white px-5 pt-3 pb-2 border-b shadow-sm">
  
        {/* 🔥 TOP GRADIENT LINE */}
        <div className="h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded mb-3"></div>
  
        {/* FILTER ROW */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
  
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = category === cat.name;
  
            return (
              <button
                key={cat.name}
                onClick={() => setCategory(cat.name)}
                className={`
                  group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap
                  transition-all duration-300 ease-in-out
  
                  ${
                    active
                      ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow hover:scale-[1.04]"
                  }
                `}
              >
                {/* ICON */}
                <Icon
                  size={16}
                  className={`
                    transition-all duration-300
                    ${
                      active
                        ? "text-white"
                        : "text-gray-500 group-hover:text-gray-700"
                    }
                  `}
                />
  
                {/* TEXT */}
                {cat.name}
  
                {/* ACTIVE DOT */}
                {active && (
                  <span className="w-1.5 h-1.5 bg-white rounded-full ml-1"></span>
                )}
              </button>
            );
          })}
  
        </div>
  
      </div>
    );
  }
  
  export default Filters;