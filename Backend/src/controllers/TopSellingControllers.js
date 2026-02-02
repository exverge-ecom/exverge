import { getTopSellingProducts } from "../model/TopSellingModels.js";

export const topSellingProducts = async(req, res)=>{

    try {
        const {from, to} = req.body;

         if (!from || !to) {
        return res.status(400).json({ message: 'from and to dates are required' });
      }
        let data;
        try {
          data = await getTopSellingProducts({from, to});
        } catch (err) {
        return res.status(500).json({ message: 'Failed to Top Selling Products Data', error: err.message });
      }
      if (!data) {
        return res.status(404).json({ message: 'No data found' });
      }
      res.status(200).json({
        success:true,
        data: data
      });
    } catch (error) {
        next(err);
    }
}