import axios from "axios";

const API_BASE_URL = "http://localhost:5001/";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


// ✅ Attach token automatically
// apiClient.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );



const apiRequest = async (endPoints, options = {}) => {
  try {
    const response = await apiClient(endPoints, options);
    //  const result = await res.json();

    return response.data;
  } catch (error) {
    console.error("Error at apiRequest", error);
    throw error;
  }
};
// dashboard/orders/trend?from=${from}&to=${to}

export const loginSignupAPI = {
  createUser: (credentials) => {
    return apiRequest(`auth/signup`, {
      method: "POST",
      data: credentials,
    });
  },

  login: (credentials) => {
    return apiRequest(`auth/login`, {
      method: "POST",
      data: credentials,
    });
  },
};

export const getOrderTrendAPI = {
  getTrend: (filterData) => {
    return apiRequest(`dashboard/orders`, {
      method: "POST",
      data: filterData,
    });
  },
};


export const getRevenueTrendAPI = {
  getRevenue: (filterData) => {
    return apiRequest(`dashboard/revenue`, {
      method: "POST",
      data: filterData,
    })
  }
}


export const getTopSellingProductsAPI = {
  getTopSellingProducts : (filterData)=> {
    return apiRequest(`dashboard/topSellingProducts`, {
      method:"POST",
      data:filterData
    })
  }
}

export const getTopPerformingChannelsAPI = {
  getTopPerformingChannels : (filterData)=>{
    return apiRequest(`dashboard/topPerformingChannels`,{
      method:"POST",
      data:filterData
    })
  }
}