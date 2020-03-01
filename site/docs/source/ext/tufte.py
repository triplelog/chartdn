from docutils import nodes
import random

class siden(nodes.Element):
	def starthtml(self,node):
		self.body.append('')
	def endhtml(self,node):
		mytext = '''<label for="'''+node.id+'''" class="margin-toggle sidenote-number"></label>
					<input type="checkbox" id="'''+node.id+'''" class="margin-toggle"/>
					<span class="sidenote">'''+node.text+'''</span>'''
		self.body.append(mytext)

class marginn(nodes.Element):
	def starthtml(self,node):
		self.body.append('')
	def endhtml(self,node):
		mytext = '''<label for="'''+node.id+'''" class="margin-toggle">&#8853;</label>
					<input type="checkbox" id="'''+node.id+'''" class="margin-toggle"/>
					<span class="marginnote">'''+node.text+'''</span>'''
		self.body.append(mytext)

class tfigure(nodes.Element):
	def starthtml(self,node):
		self.body.append('')
	def endhtml(self,node):
		mytext = '''<figure '''+node.fullwidth+'''>
					<img src="'''+node.src+'''"/>
					</figure>'''
		self.body.append(mytext)		
	
def autosidenote(id):
    def role(name, rawtext, text, lineno, inliner, options={}, content=[]):
        node = siden()
        node.id = id + str(random.random())
        node.text = text
        return [node], []
    return role
def automarginnote(id):
    def role(name, rawtext, text, lineno, inliner, options={}, content=[]):
        node = marginn()
        node.id = id + str(random.random())
        node.text = text
        return [node], []
    return role
def autofigure():
    def role(name, rawtext, text, lineno, inliner, options={}, content=[]):
        node = tfigure()
        node.fullwidth = 'class="fullwidth"'
        node.src = text
        return [node], []
    return role    
    
def setup(app):
    app.add_node(siden, html=(siden.starthtml,siden.endhtml))
    app.add_node(marginn, html=(marginn.starthtml,marginn.endhtml))
    app.add_node(tfigure, html=(tfigure.starthtml,tfigure.endhtml))
    app.add_role('sidenote', autosidenote('test1'))
    app.add_role('marginnote', automarginnote('test2'))
    app.add_role('figure', autofigure())

    return {
        'version': '0.1',
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }