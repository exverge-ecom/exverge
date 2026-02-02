import { getRevenueTrend, getOrderTrend } from "../model/DashboardModels.js";


 export const orderTrend = async (req, res, next)=> {
    try {
      // const { from, to, warehouseIdentifier = null } = req.query;
      // let { channel } = req.query;
      
      const { from, to, warehouseIdentifier = null, brand = null } = req.body;
      let { channel } = req.body;

      // console.log(warehouseIdentifier);
      

      if (!from || !to) {
        return res.status(400).json({ message: 'from and to dates are required' });
      }

      if(channel && !Array.isArray(channel)){
        channel = [channel];
      }

      let data;
      try {
        data = await getOrderTrend({
          from,
          to,
          warehouseIdentifier,
          channels: channel, //renamed
          brand
        });
      } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch order trend', error: err.message });
      }
      if (!data) {
        return res.status(404).json({ message: 'No data found' });
      }
      res.status(200).json({
        success:true,
        data: data
      });
    } catch (err) {
      next(err);
    }
  }

 export const revenueTrend = async (req, res, next) => {
    try {
      const { from, to, warehouseIdentifier = null, channel = null, brand = null } = req.body;

      if (!from || !to) {
        return res.status(400).json({ message: 'from and to dates are required' });
      }

       if(channel && !Array.isArray(channel)){
        channel = [channel];
      }
      let data;
      try {
        
     
       data = await getRevenueTrend({
        from,
        to,
        warehouseIdentifier,
        channels: channel,
        brand
      });

       } catch (error) {
         return res.status(500).json({ message: 'Failed to fetch Revenue trend', error: error.message });
        
      }
      if(!data){
        return res.status(404).json({ message: 'No data found' });
      }

      res.status(200).json({
        success:true,
        data:data
      });
    } catch (err) {
      next(err);
    }
  }


