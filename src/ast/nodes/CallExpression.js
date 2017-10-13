import Node from '../Node.js';

export default class CallExpression extends Node {
	bindNode () {
		if ( this.callee.type === 'Identifier' ) {
			const variable = this.scope.findVariable( this.callee.name );

			if ( variable.isNamespace ) {
				this.module.error( {
					code: 'CANNOT_CALL_NAMESPACE',
					message: `Cannot call a namespace ('${this.callee.name}')`
				}, this.start );
			}

			if ( this.callee.name === 'eval' && variable.isGlobal ) {
				this.module.warn( {
					code: 'EVAL',
					message: `Use of eval is strongly discouraged, as it poses security risks and may cause issues with minification`,
					url: 'https://github.com/rollup/rollup/wiki/Troubleshooting#avoiding-eval'
				}, this.start );
			}
		}
	}

	hasEffects ( options ) {
		return this.included
			|| this.arguments.some( child => child.hasEffects( options ) )
			|| (
				!options.hasNodeBeenCalledWithOptions( this, this._callOptions )
				&& this.callee.hasEffectsWhenCalledAtPath( [], this._callOptions,
					options.getHasEffectsWhenCalledOptions( this, this._callOptions ) )
			);
	}

	hasEffectsWhenAccessedAtPath ( path, options ) {
		if ( options.hasNodeBeenAccessedAtPath( path, this ) ) {
			return false;
		}
		const innerOptions = options.addAccessedNodeAtPath( path, this );
		return this.callee.someReturnExpressionWhenCalledAtPath( [], this._callOptions, node =>
			node.hasEffectsWhenAccessedAtPath( path, innerOptions ) );
	}

	hasEffectsWhenAssignedAtPath ( path, options ) {
		return this.callee.someReturnExpressionWhenCalledAtPath( [], this._callOptions, node =>
			node.hasEffectsWhenAssignedAtPath( path, options ) );
	}

	hasEffectsWhenCalledAtPath ( path, callOptions, options ) {
		return this.callee.someReturnExpressionWhenCalledAtPath( [], this._callOptions, node =>
			node.hasEffectsWhenCalledAtPath( path, callOptions, options ) );
	}

	initialiseNode () {
		this._callOptions = { withNew: false };
	}

	someReturnExpressionWhenCalledAtPath ( path, callOptions, predicateFunction ) {
		return this.callee.someReturnExpressionWhenCalledAtPath( [], this._callOptions, node =>
			node.someReturnExpressionWhenCalledAtPath( path, callOptions, predicateFunction ) );
	}
}
