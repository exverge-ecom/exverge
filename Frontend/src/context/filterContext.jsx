import { React, createContext, useContext, useState } from "react";
const FilterContext = createContext(null);

export const FilterProvider = ({ children }) => {
  const initFilterValues = {
    from: "",
    to: "",
    warehouseIdentifier: "",
    channel: [],
    brand:""
  };

  const [filterData, setFilterData] = useState(initFilterValues);

  const updateFilter = (key, value) => {
    setFilterData((prev) => {
      // Step 1: Check if the filter value is an array (multi-select case)
      if (Array.isArray(prev[key])) {
        const exists = prev[key].includes(value);

        return {
          ...prev,
          [key]: exists
            ? prev[key].filter((v) => v !== value) // remove
            : [...prev[key], value], // add
        };
      }

      // Step 2: Normal (non-array) filter update
      return {
        ...prev,
        [key]: value,
      };
    });
  };

  const resetFilter = () => {
    setFilterData(initFilterValues);
  };

  return (
    <FilterContext.Provider value={{ filterData, updateFilter, resetFilter }}>
      {children}
    </FilterContext.Provider>
  );
};



export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within FilterProvider");
  }
  return context;
};