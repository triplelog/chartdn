.. ChartDN documentation master file, created by
   sphinx-quickstart on Fri Feb 28 10:05:45 2020.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

How to use ChartDN
===================================

.. toctree::
   :maxdepth: 2
   :caption: Contents:

Each section of ChartDN has help icons that you can click for more information, so feel free to get started without reading these docs. If you need help you can click to hopefully answer your question.

Once you know the basics you can return to this page to see if there are any features you overlooked.

Note that we are still in beta so if something really isn't working as it should it could be a bug. Report it here. If you would like to be able to do something that is not currently possible, suggest new features here.

Create Charts
==================

ChartDN makes it easy to create charts that be shared, forked, and customized at any time. There are three steps to creating a chart: 

* Gathering Raw Data

* Modifying the Data

* Creating the Chart

These three parts are kept separate\ :sidenote:`Whenever possible do not manually change the raw data. These changes would need to be repeated manually if the data needs to be updated.` so that future updates are as simple as possible. In particular, it is simple to apply the same type of chart to multiple datasets. Or to keep track of several different charts from the same data source.

Raw Data
-------------

In the raw data step, the goal is to do as little as possible. It should be as simple as letting ChartDN know where the file (.csv, .xls, or .xlsx) is located. Only the first 50 columns of the file will be saved. Uncompressed file size must be less than 100 KB, 1 MB, or 10 MB.

* Upload from your computer. Drag and drop a file or use the Choose File button to browse your computer's file system.

* Link to URL. Copy the link location\ :marginnote:`Right click on a link and select Copy Link or visit the file and copy the url from the address bar.` of a data file and paste it into the URL input box. Any publicly accesible url should work so S3 and other data in the cloud should also work. This data will be downloaded from the host so make sure you have permission.

* Manual Entry and/or Copy/Paste. You can copy data from a csv text file or most spreadsheet programs and paste it in the box. Also copying data from an HTML table or PDF should work if the web site and/or PDF is formatted like a table.

ChartDN should automatically detect the delimiter, number of header rows, and data types for each column. If any of these are incorrect you can manually change the setting by clicking the appropriate input.

If you need to make any changes to the raw data you can click any data cell to change the value. Move rows by dragging the row number cell--the first cell in each row. Move columns by dragging the header cell in each column. Clicking the first cell in a row or column allows you to delete that row or column.

Any edits at this stage cannot be undone without re-uploading the file and starting over. 

Modify Data
-------------

Once you have a nice raw dataset, you have lots of options if you need to manipulate it.

* Pivot Tables

* Sort

* New Columns

* Find and Replace

* Filter



Create Chart
-------------

Make your chart exactly as you like.

* Choose type. For more information about chart types go to the chart type section.

* Choose Data. Pick the columns you want in your chart.

* Styling. Change colors, labels, etc.

* Choose Framework. Use Plotly, ChartJS, Google, Chartist, XKCD, or pgfplots. 


Share Charts
==================

Easily share your charts

* Each chart has a URL.

* Embed on your website or blog

* Grab the data as javascript, SVG, PNG, etc.

Data Types
==================

Lots of data types can be handled with ease

* Numbers: Integers, Floats, or Percentages

* Strings

* Dates

Chart Types
==================

Line charts, pie charts, etc.

Account 
==================

Create an account to easily share with friends and much more.
