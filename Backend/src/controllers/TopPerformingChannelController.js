import { getTopPerformingChannels } from "../model/TopPerformingChannelModel.js";

export const topPerformingChannels = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    if (!from || !to) {
      return res
        .status(400)
        .json({ message: "from and to dates are required" });
    }
    let data;
    try {
      data = await getTopPerformingChannels({ from, to });
    } catch (error) {
      return res
        .status(500)
        .json({
          message: "Failed to Top Performing Channels Data",
          error: err.message,
        });
    }
    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    next(err);
  }
};
