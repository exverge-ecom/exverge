import React from 'react'

const TopSellingProducts = ({info}) => {

    if (!info || info.length === 0) {
        return (
            <div className="w-full bg-white p-6 rounded shadow">
                <h2 className="text-xl font-bold mb-4">Top Selling Products</h2>
                <div className="flex items-center justify-center h-48">
                    <p className="text-gray-500">No products data available. Please select filters.</p>
                </div>
            </div>
        );
    }

    try {
        return (
            <div className="w-full bg-white p-6 rounded shadow">
                <h2 className="text-xl font-bold mb-4">Top Selling Products</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold">Rank</th>
                                <th className="px-4 py-3 text-left font-semibold">Product SKU</th>
                                <th className="px-4 py-3 text-left font-semibold">Product Name</th>
                                <th className="px-4 py-3 text-right font-semibold">Units Sold</th>
                            </tr>
                        </thead>
                        <tbody>
                            {info.map((product, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50 transition">
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs">
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-gray-700">{product.item_sku || '-'}</td>
                                    <td className="px-4 py-3 text-gray-800">{product.item_name || '-'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
                                            {product.number_of_items || 0}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    } catch (error) {
        console.error("Error rendering top selling products:", error);
        return (
            <div className="w-full bg-white p-6 rounded shadow">
                <h2 className="text-xl font-bold mb-4">Top Selling Products</h2>
                <div className="flex items-center justify-center h-48">
                    <p className="text-red-500">Error loading products data.</p>
                </div>
            </div>
        );
    }
}

export default TopSellingProducts
